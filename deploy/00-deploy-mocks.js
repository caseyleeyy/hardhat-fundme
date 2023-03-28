const { network } = require("hardhat");

const { devChain, DECIMALS, INITIAL_ANS } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  if (devChain.includes(network.name)) {
    log("local network detected, deploying mocks...");

    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANS],
    });

    log("MockV3Aggregator deployed.");
    log(
      "-----------------------------------------------------------------------------------"
    );
  }
};

module.exports.tags = ["all", "mocks"];
//yarn hardhat deploy --tags mocks to only deploy this script with the tag mocks
