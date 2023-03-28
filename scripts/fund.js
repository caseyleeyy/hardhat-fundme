const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log("funding contract.....");

  const transactionResponse = await fundMe.fund({
    value: ethers.utils.parseEther("0.03"),
  });

  await transactionResponse.wait(1);
  console.log("fundeded");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
