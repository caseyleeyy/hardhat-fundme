//What this contract does:
//Get funds from users
//Withdraw funds
//Set a min funding value in USD

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

//custom errors for gas saving, can be used to replace require statements for reverting errors
//(saves gas by sending error code instead of an entire string)
error FundMe__NotOwner();

/// @title A contract for crowd funding
/// @author AhBear
/// @notice This contract is to demo a sample funding contract
/// @dev This implements price feeds as library
/// @custom:experimental This is an experimental contract.
contract FundMe {
    using PriceConverter for uint256;

    //set a min fund amt in usd
    //using constant and immutable saves on gas fee, so use when possible!
    //s_ = storage variable ***TONS OF GAS USE FOR STORING AND RETRIEVING***
    //i_ = immutable variable *doesn't cost gas*
    //private and internal functions are cheaper than public functions
    uint256 public constant MIN_USD = 50 * 1e18;

    address[] private s_funders;
    //keep track of which address funded how much
    mapping(address => uint256) private s_addressToAmtFunded;
    address private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner() {
        //custom modifier that requires that the withdrawer is the owner, so only owner can call this function
        // require(msg.sender == i_owner, "sender is not owner");
        //change require to revert for gas efficiency
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _; //this is the "rest of the code", so essentially run the rest only after the above check
    }

    //deployed immediately when contract runs
    constructor(address priceFeedChainlink) {
        //set owner of this contract to whoever deployed the contract
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedChainlink);
    }

    //what happens if someone sends this contract ETH without calling fund function?
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /// @notice This function funds this contract
    /// @dev This implements price feeds as library
    /// @ param -
    /// @ returns -
    //to send eth to this contract
    function fund() public payable {
        //require min x eth to be send, else revert with error
        //reverting = undo any previous actions and send remaining gas back
        //NOTE: any gas used BEFORE the require get used, and all prior work gets UNDONE!!! (gas used not returned!)
        // require(msg.value > 1e18, "Send min. 1 eth"); //1e18 = 1 * 10 ^ 18 zeros
        //msg.value & msg.sender are native solidity functions
        //msg.value = how much eth is sent, while msg.sender = address which sent the eth
        // require(getConversionRate(msg.value) >= MIN_USD, "Send min. USD$50");
        //msg.value.getConversionRate() and getConversionRate(msg.value) is the SAME
        //as the 1st value of the function is passed onto itself
        // require(
        //     msg.value.getConversionRate(s_priceFeed) >= MIN_USD,
        //     "Send min. USD$50"
        // );

        require(
            msg.value.getConversionRate(s_priceFeed) >= MIN_USD,
            "Send min. USD$50"
        );
        s_funders.push(msg.sender);
        s_addressToAmtFunded[msg.sender] = msg.value;
    }

    function withdraw() public payable onlyOwner {
        //starting index, ending index, step
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmtFunded[funder] = 0;
        }

        //reset funders array
        s_funders = new address[](0);

        //withdraw funds (3 ways to do that): transfer, send, call

        //transfer: max limit = 2300 gas, if fail, throws error and revert
        //address(this).balance = balance of this contract
        //typecast msg.sender (type address) to payable address
        // payable(msg.sender).transfer(address(this).balance);

        //send: max limit = 2300 gas, returns bool & only reverts on fail IF require statement is there
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "send failed");

        //call: low level function, no cap gas
        //can call other functions in (""), but not calling function here to send tokens, so leaving it blank
        //call returns 2 things: bool callSuccess, bytes memory dataReturned
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        //mappings cannot be in memory!
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmtFunded[funder] = 0;
        }

        //reset funders array
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success, "call failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmtFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmtFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
