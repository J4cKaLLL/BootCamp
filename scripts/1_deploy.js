const { ethers } = require("hardhat")

async function main(){
	// Fetch contract to deploy
	const Token = await ethers.getContractFactory("Token")

	// Deploy contract
	const token = await Token.deploy("LotRy","LOTR",1000000)	
	await token.deployed()	
	console.log(`Token Deployed to: ${token.address}`)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
	console.error(error);
	process.exit(1);
	});
			
