const { ethers, upgrades } = require("hardhat");
const { exec } = require("child_process");
// require("dotenv").config({ path: __dirname + "./../.env" });
var Web3 = require("web3");

var config = require("./../config/index");

async function main() {
  const NETWORK = "base";

  // Deploying Disburse
  console.log("Deploying disburse implementation");
  const Disburse = await ethers.getContractFactory("Disburse");
  const disburse = await Disburse.deploy();
  await disburse.deployed();
  console.log("Disburse deployed to:", disburse.address);
  exec(
    `npx hardhat verify --network ${NETWORK} ${disburse.address}`,
    async (error, stdout, stderr) => {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      console.log(error);
    }
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
