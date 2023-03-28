const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { devChain } = require("../../helper-hardhat-config");

//only run on dev chain & localhost
devChain.includes(network.name)
  ? describe("FundMe", async function () {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      const sendVal = ethers.utils.parseEther("1"); //1 eth

      //deploy FundMe contract with hardhat-deploy
      beforeEach(async function () {
        //returns the array in account section of network in hardhat.config.js
        // const accounts = await ethers.getSigners();
        deployer = (await getNamedAccounts()).deployer;
        //deploy all contracts in deploy folder with the tags in the array
        await deployments.fixture(["all"]);
        //getContract gets the most recent deployment of the contract "name" which is deployed
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", async function () {
        it("sets aggregator addresses correctly", async function () {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", async function () {
        it("fails if not enough eth sent", async function () {
          await expect(fundMe.fund()).to.be.revertedWith("Send min. USD$50");
        });

        it("adds funder to s_funders array", async function () {
          await fundMe.fund({ value: sendVal });
          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });

        it("updated the s_addressToAmtFunded data structure with correct value", async function () {
          await fundMe.fund({ value: sendVal });
          const response = await fundMe.getAddressToAmtFunded(deployer);

          assert.equal(response.toString(), sendVal.toString());
        });
      });

      describe("withdraw", async function () {
        //start with some funds in the contract
        beforeEach(async function () {
          await fundMe.fund({ value: sendVal });
        });

        it("withdraw eth from a single founder", async function () {
          //start with
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          //make sure gas used is calculated in final balance - first by finding out how much gas is used
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          //check that startingFundMeBalance has been added to startingDeployerBalance
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("allows withdraw with multiple funders", async function () {
          const accounts = await ethers.getSigners();

          //i = 1 as index 0 is the deployer
          //5 accounts to send 1 eth each to the contract (non deployer)
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);

            await fundMeConnectedContract.fund({ value: sendVal });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          //make sure gas used is calculated in final balance - first by finding out how much gas is used
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          //check that startingFundMeBalance has been added to startingDeployerBalance
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance),
            endingDeployerBalance.add(gasCost).toString()
          );

          //make sure s_funders array is reset properly
          //if funder[0] throws an error, is correct
          await expect(fundMe.getFunder(0)).to.be.reverted;

          //check that each element in s_addressToAmtFunded mapping is == 0
          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmtFunded(accounts[i].address),
              0
            );
          }
        });

        it("only allows contract deployer to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);

          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        });

        it("cheaper withdraw eth from a single founder", async function () {
          //start with
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          //make sure gas used is calculated in final balance - first by finding out how much gas is used
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          //check that startingFundMeBalance has been added to startingDeployerBalance
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("allows cheaper withdraw with multiple funders", async function () {
          const accounts = await ethers.getSigners();

          //i = 1 as index 0 is the deployer
          //5 accounts to send 1 eth each to the contract (non deployer)
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);

            await fundMeConnectedContract.fund({ value: sendVal });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          //make sure gas used is calculated in final balance - first by finding out how much gas is used
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          //check that startingFundMeBalance has been added to startingDeployerBalance
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance),
            endingDeployerBalance.add(gasCost).toString()
          );

          //make sure s_funders array is reset properly
          //if funder[0] throws an error, is correct
          await expect(fundMe.getFunder(0)).to.be.reverted;

          //check that each element in s_addressToAmtFunded mapping is == 0
          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmtFunded(accounts[i].address),
              0
            );
          }
        });
      });

      //   it();
    })
  : describe.skip;
