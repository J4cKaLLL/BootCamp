const { ethers } = require('hardhat')
const { expect } = require('chai')

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Token", ()=> {
	let token, accounts, deployer, receiver, exchange

	beforeEach(async () => {				
		const Token = await ethers.getContractFactory('Token')		
		token = await Token.deploy("LotRy","LOTR",1000000)
		accounts = await ethers.getSigners()
		deployer = accounts[0]
		receiver = accounts[1]
		exchange = accounts[2]		
	})

	describe("Deployment", ()=>{
		const name = "LotRy"
		const symbol = "LOTR"
		const decimals = 18
		const totalSupply = tokens("1000000")

		it("Has the correct name", async ()=> {	
		expect(await token.name()).to.equal(name)
		})
		it("Has the correct symbol", async ()=> {
			expect(await token.symbol()).to.equal(symbol)
		})
		it("Has the correct decimals", async ()=> {
			expect(await token.decimals()).to.equal(decimals)
		})
		it("Has a correct total supply", async()=> {			
			expect(await token.totalSupply()).to.equal(totalSupply)
		})
		it("Assigns the total supply to deployer", async () => {	
			console.log(deployer.address)		
			expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
		})
	})	
	describe("Sending Tokens",()=>{
		let amount, transaction, result

		describe("Success", ()=>{
			beforeEach(async() => {
				amount = tokens(100)
				transaction = await token.connect(deployer).transfer(receiver.address, amount)
				result = await transaction.wait()
			})
			it("transfer token balances", async ()=>{
				//Log Balance before transfer
				console.log("Deployer balance before transfer", await token.balanceOf(deployer.address))
				console.log("Receiver balance before transfer", await token.balanceOf(receiver.address))
				//Transfer tokens
				
				
				expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
				expect(await token.balanceOf(receiver.address)).to.equal(amount)


				//Log Balance after transfer
				console.log("Deployer balance after transfer", await token.balanceOf(deployer.address))
				console.log("Receiver balance after transfer", await token.balanceOf(receiver.address))
				// Ensure that tokens were transfered (balance changed)
			})
			it("emits a Transfer event", async() =>{
				const event = result.events[0]			
				expect(event.event).to.equal("Transfer")
				const args = event.args
				expect(args.from).to.equal(deployer.address)
				expect(args.to).to.equal(receiver.address)
				expect(args.value).to.equal(amount)
			})
		})
		describe("Failure", ()=>{
			it("reject insufficient balances", async () =>{
				//Transfer more tokens than deployer has - 10M
				const invalidAmount = tokens(1000001)
				await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
			})
			it("Rejects invalid recipient", async() =>{
				const amount = tokens(100)
				await expect(token.connect(deployer).transfer("0x000000000000000000000000000000000", amount)).to.be.reverted
			})
		})
	})
	describe("Approving Tokens",()=>{
		let amount, transaction, result

		beforeEach(async() => {
			amount = tokens(100)
			transaction = await token.connect(deployer).approve(exchange.address, amount)
			result = await transaction.wait()

		})
		describe("Success",()=>{
			it("Allocates an allowance for delegated token spending", async() =>{
				expect ( await token.allowance(deployer.address, exchange.address)).to.equal(amount)
			})
			it("emits a Approval event", async() =>{
				const event = result.events[0]			
				expect(event.event).to.equal("Approval")
				const args = event.args
				expect(args.owner).to.equal(deployer.address)
				expect(args.spender).to.equal(exchange.address)
				expect(args.value).to.equal(amount)
			})
		})
		describe("Failure",()=>{
			it("Reject Invalid Spenders", async()=>{
				await expect(token.connect(deployer).approve("0x000000000000000000000000000000000", amount)).to.be.reverted
			})
			it("Reject owner = spender", async()=>{
				await expect(token.connect(deployer).approve(deployer.address, amount)).to.be.reverted
			})
			
		})
	})
	describe("Delegated Token Transfers", () => {
		
		let amount, transaction, result

		beforeEach(async() => {
			amount = tokens(100)
			transaction = await token.connect(deployer).approve(exchange.address, amount)
			result = await transaction.wait()
		})		

		describe("Success", ()=>{
			beforeEach(async() => {				
				transaction = await token.connect(exchange).transferFrom(deployer.address,receiver.address, amount)
				result = await transaction.wait()
			})
			it("Transfers token balances", async () =>{

				expect(await token.balanceOf(deployer.address)).to.be.equal(tokens(999900))
				expect(await token.balanceOf(receiver.address)).to.be.equal(amount)
			})	
			it("Reset the allowance", async() => {
				expect(await token.allowance(deployer.address,exchange.address)).to.be.equal(0)
			})
		})
		describe("Failure", ()=>{
			// Attemtps to transfer too many tokens
			it("Attemtps to transfer too many tokens", async () =>{
				const invalidAmount = tokens(10000000)
				await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted;
			})
		})
	})
})
