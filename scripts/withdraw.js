const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log("starting wd...");

  const transactionResponse = await fundMe.cheaperWithdraw();
  await transactionResponse.wait(1);
  console.log("withdrawn!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
