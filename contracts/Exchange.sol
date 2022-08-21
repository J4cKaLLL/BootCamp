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
	mapping(uint256 => bool) public orderCancelled; // true or false 
	mapping(uint256 => bool) public orderFilled; // true or false 

	event Deposit(
		address token, 
		address user, 
		uint256 amount, 
		uint balance
	);

	event Withdraw(
		address token, 
		address user, 
		uint256 amount, 
		uint balance
	);

	event Order(
			// Attributes of an order
		uint256 id,        // Unique identifier for order
		address user,     // User who made the order
		address tokenGet,  // Address of the token they receive
		uint256 amountGet, // Amount they receive
		address tokenGive, // Address of token they give
		uint256 amountGive, // Amount they give
		uint256 timestamp
	);
	
	event Cancel(
			// Attributes of an order
		uint256 id,        // Unique identifier for order
		address user,     // User who made the order
		address tokenGet,  // Address of the token they receive
		uint256 amountGet, // Amount they receive
		address tokenGive, // Address of token they give
		uint256 amountGive, // Amount they give
		uint256 timestamp
	);	

	event Trade(
			// Attributes of an order
		uint256 id,        // Unique identifier for order
		address user,     // User who made the order
		address tokenGet,  // Address of the token they receive
		uint256 amountGet, // Amount they receive
		address tokenGive, // Address of token they give
		uint256 amountGive, // Amount they give
		address creator,
		uint256 timestamp
	);	

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
		orderCount++;
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

	function cancelOrder(uint256 _id) public {
		// fetch Order
		_Order storage _order = orders[_id];

		// Order must exist
		require(address(_order.user) == msg.sender);
		// Cancel the order
		require(_order.id == _id);
		
		// Cancel Order
		orderCancelled[_id] = true;

		// Emit event
		emit Cancel(
			_order.id, 	
			msg.sender, 	
			_order.tokenGet,  	
			_order.amountGet,		
			_order.tokenGive,		
			_order.amountGive,	
			block.timestamp 
		);
	}

	// Executing Orders


	function fillOrder(uint256 _id) public {
		// 1. Must be valid orderId
		require(_id > 0 && _id <= orderCount, "Order does not exist");
		// 2. Order can't be filled
		require(!orderFilled[_id]);
		// 3. Order can't be cancelled
		require(!orderCancelled[_id]);

		// Fetch Order
		_Order storage _order = orders[_id];
		// Swapping Tokens / Trading
		_trade(
			_order.id, 
			_order.user,
			_order.tokenGet,
			_order.amountGet,
			_order.tokenGive,
			_order.amountGive
		);
		orderFilled[_order.id] = true;
	}

	function _trade(
		uint256 _orderId,
		address _user,
		address _tokenGet,
		uint256 _amountGet,
		address _tokenGive,
		uint256 _amountGive
	) internal {

		// Fee is paid by the user who filled the order (msg.sender)
		// Fee is deducted from _amountGet

		uint256 _feeAmount = (_amountGet * feePercent) / 100; 


		// Execute the trade
		// msg.sender is the user who filled the order, while _user is who created the order
		tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender] - (_amountGet + _feeAmount);
		tokens[_tokenGet][_user] = tokens[_tokenGet][_user] + _amountGet;

		// Charge Fees

		tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount] + _feeAmount;

		tokens[_tokenGive][_user] = tokens[_tokenGive][_user] - _amountGive;
		tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender] + _amountGive;

		emit Trade(
			_orderId, 	
			msg.sender, 	
			_tokenGet,  	
			_amountGet,		
			_tokenGive,		
			_amountGive,
			_user,	
			block.timestamp 
		);
	}
}


