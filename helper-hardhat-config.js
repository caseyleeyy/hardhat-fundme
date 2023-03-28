const networkConfig = {
  11155111: {
    name: "sepolia",
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  },
  137: {
    name: "polygon",
    ethUsdPriceFeed: "0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676",
  },
};

const devChain = ["hardhat", "localhost"];
const DECIMALS = 8;
const INITIAL_ANS = 200000000000;

module.exports = {
  networkConfig,
  devChain,
  DECIMALS,
  INITIAL_ANS,
};
