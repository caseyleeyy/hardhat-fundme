const { assert } = require("chai");
const { getNamedAccounts, ethers, network } = require("hardhat");

const { devChain } = require("../../helper-hardhat-config");

//make this test run only if on testnet, not localhost
devChain.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe;
      let deployer;
      const sendValue = ethers.utils.parseEther("0.03");

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      it("allows people to fund and withdraw", async function () {
        const fundTransactionResponse = await fundMe.fund({ value: sendValue });
        await fundTransactionResponse.wait(1);
        const wdTransactionResponse = await fundMe.cheaperWithdraw();
        await wdTransactionResponse.wait(1);

        const endingBalance = await fundMe.provider.getBalance(fundMe.address);
        assert.equal(endingBalance.toString(), "0");
      });
    });
