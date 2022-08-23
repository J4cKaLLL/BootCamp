const config = require("../src/config.json")
const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

const wait =(seconds) => {
	const milliseconds = seconds * 1000
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}


async function main(){
	// Fetch accounts form wallet - these are unlocked
	const accounts = await ethers.getSigners()

	// Fetch network

	const {chainId} = await ethers.provider.getNetwork()
	console.log("Using chainId: ", chainId)

	const Dapp = await ethers.getContractAt('Token', config[chainId].Dapp.address )
	console.log (`Dapp Token Fetched: ${Dapp.address}\n`)

	const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address )
	console.log (`mETH Token Fetched: ${mETH.address}\n`)

	const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address )
	console.log (`mDAI Token Fetched: ${mDAI.address}\n`)


    const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address )
	console.log (`exchange Token Fetched: ${exchange.address}\n`)


	// Give tokens to account [1]	
	const sender = accounts[0]
	const receiver = accounts[1]
	let amount = tokens(10000)

    // user1 transfers 10000 mETH
	let transaction, result
	transaction = await mETH.connect(sender).transfer(receiver.address, amount)
	console.log(`Transferred ${amount} tokens from ${sender.address} to ${receiver.address}\n`)

	// Set up exchange users

	const user1 = accounts[0]
	const user2 = accounts[1]
	amount = tokens(10000)

	// user1 approves 10000 Dapp
	transaction = await Dapp.connect(user1).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`Approved ${amount} tokens from ${user1.address}`)

	// user1 deposits 10000 Dapp
	transaction = await exchange.connect(user1).depositToken(Dapp.address, amount)
	await transaction.wait()
	console.log(`Deposited ${amount} tokens from ${user1.address}\n`)

	// user2 approves 10000 mETH
	transaction = await mETH.connect(user2).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`Approved ${amount} tokens from ${user2.address}`)

	// user1 deposits 10000 Dapp
	transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
	await transaction.wait()
	console.log(`Deposited ${amount} tokens from ${user2.address}\n`)

	// Seed a Cancelled Order
	//
	// User1 makes order to get tokens

	let orderId
	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), Dapp.address, tokens(5))
	result = await transaction.wait()
	console.log(`Made order from ${user1.address}`)

	// User1 cancelos the order
	orderId = result.events[0].args.id 
	transaction = await exchange.connect(user1).cancelOrder(orderId)
	result = await transaction.wait()
	console.log(`Cancelled order from ${user1.address}\n`)

	// wait 1 second
	await wait(1)

	// Seed a Filled Order
	//	
	// User1 makes order 

	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), Dapp.address, tokens(20))
	result = await transaction.wait()
	console.log(`Made order from ${user1.address}`)

	// User2 filled the order
	orderId = result.events[0].args.id 
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled order from ${user1.address}\n`)


	// wait 1 second
	await wait(1)

	// User1 makes 10 orders 
	for (let i = 1; i <=10; i++){		
		transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), Dapp.address, tokens(10))	
		result = await transaction.wait()
		console.log(`Made order from ${user1.address}`)	

		await wait(1)
	}

	// User2 makes 10 orders 
	for (let i = 1; i <=10; i++){		
		transaction = await exchange.connect(user2).makeOrder(Dapp.address, tokens(10), mETH.address, tokens(10 * i))	
		result = await transaction.wait()
		console.log(`Made order from ${user2.address}`)

		await wait(1)
	}
	// Cancel Orders

	// Fill Orders



}

main()
	.then(() => process.exit(0))
	.catch((error) =>{
		console.error(error);
		process.exit(1);
	});