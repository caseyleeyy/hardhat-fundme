//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import npm package of @chainlink/contracts
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    //price of eth in terms of usd
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        //need ABI and addr of chainlink contract
        //abi: npm package import on top - import interface of contract, where interface is similar to c++ .h files
        //addr: 0x694AA1769357215DE4FAC081bf1f309aDC325306
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0x694AA1769357215DE4FAC081bf1f309aDC325306
        // );
        (, int256 price, , , ) = priceFeed.latestRoundData();

        return uint256(price * 1e10); //to get price to match up to msg.value which has 18 zeros & is an uint256
    }

    //convert no. of eth in terms of usd
    function getConversionRate(
        uint256 ethAmt,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmtInUsd = (ethPrice * ethAmt) / 1e18;

        return ethAmtInUsd;
    }
}
