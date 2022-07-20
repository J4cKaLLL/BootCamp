const { ethers } = require('hardhat')
const { expect } = require('chai')



const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Token", ()=> {
	let token, accounts, deployer

	beforeEach(async () => {		
		const Token = await ethers.getContractFactory('Token')		
		token = await Token.deploy("LotRy","LOTR",1000000)
		accounts = await ethers.getSigners()
		deployer = accounts[0]
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
})