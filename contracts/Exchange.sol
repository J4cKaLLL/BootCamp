// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
	address public feeAccount;
	uint256 public feePercent;
	mapping(address => mapping (address => uint256)) public tokens;
	mapping(uint256 => _Order) public orders;
	uint256 public orderCount; 

	event Deposit(
		address token, 
		address user, 
		uint256 amount, 
		uint balance);
	event Withdraw(
		address token, 
		address user, 
		uint256 amount, 
		uint balance);

	event Order(
			// Attributes of an order
		uint256 id,        // Unique identifier for order
		address user,     // User who made the order
		address tokenGet,  // Address of the token they receive
		uint256 amountGet, // Amount they receive
		address tokenGive, // Address of token they give
		uint256 amountGive, // Amount they give
		uint256 timestamp);
		

	// Orders Mapping
	struct _Order {
		// Attributes of an order
		uint256 id;        // Unique identifier for order
		address user;      // User who made the order
		address tokenGet;  // Address of the token they receive
		uint256 amountGet; // Amount they receive
		address tokenGive; // Address of token they give
		uint256 amountGive; // Amount they give
		uint256 timestamp;
	}

	constructor(address _feeAccount, uint256 _feePercent){
		feeAccount = _feeAccount;
		feePercent = _feePercent;
	}
// Deposit Tokens

	function depositToken(address _token, uint256 _amount) public {
		// Transfer tokens to exchange
		Token(_token).transferFrom(msg.sender, address(this), _amount);
		// Update user balance
		tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;
		// Emit an event
		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);

	}

// Withdraw

	function withdrawToken(address _token, uint256 _amount) public {
		//Ensure user has enough tokens to withdraw
		require(tokens[_token][msg.sender] >= _amount);
		// Tranfer tokens to user		
		Token(_token).transfer(msg.sender, _amount);
// Update user balance
		tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
		// Emit an event
		emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

// Check Balances
	function balanceOf(address _token, address _user)
		public
		view
		returns (uint256)
	{
		
		return tokens[_token][_user];
	}

	function makeOrder(
		address _tokenGet, 
		uint256 _amountGet, 
		address _tokenGive, 
		uint256 _amountGive
	) public{
		require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

		// CREATE ORDER
		orderCount = orderCount + 1;
		orders[orderCount] = _Order(
			orderCount, 	
			msg.sender, 	
			_tokenGet,  	
			_amountGet,		
			_tokenGive,		
			_amountGive,	
			block.timestamp 
		);
		emit Order(
			orderCount, 	
			msg.sender, 	
			_tokenGet,  	
			_amountGet,		
			_tokenGive,		
			_amountGive,	
			block.timestamp 
		);
	}

}


