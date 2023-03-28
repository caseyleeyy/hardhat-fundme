// module.exports = async (hre) => {
//   const { getNamedAccounts, deployments } = hre;
// };

const { network } = require("hardhat");

const { networkConfig, devChain } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  //if chainId is X use addr Y
  let ethUsdPriceFeedAddr;

  //on localhost, contract doesn't exist for chainlink, deploy a minimal version
  //when working on localhost/hardhat network, use a mock to simulate chainlink
  if (devChain.includes(network.name)) {
    const localEthUsdAggregator = await get("MockV3Aggregator");
    ethUsdPriceFeedAddr = localEthUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddr = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  const args = [ethUsdPriceFeedAddr];

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmation || 1,
  });

  log(
    "-----------------------------------------------------------------------------------"
  );

  //verify if not on localhost
  if (!devChain.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(fundMe.address, args);
  }
};

module.exports.tags = ["all", "fundme"];
