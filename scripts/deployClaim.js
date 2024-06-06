const { ethers, upgrades } = require("hardhat");
const { exec } = require("child_process");
// require("dotenv").config({ path: __dirname + "./../.env" });
var Web3 = require("web3");

var config = require("./../config/index");

async function main() {
  const NETWORK = "base";

  // Deploying sample claim
  console.log("Deploying claim implementation");
  const Claim = await ethers.getContractFactory("Claim");
  const claim_instance = await Claim.deploy();
  await claim_instance.deployed();
  console.log("Claim deployed to:", claim_instance.address);
  exec(
    `npx hardhat verify --network ${NETWORK} ${claim_instance.address}`,
    async (error, stdout, stderr) => {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      console.log(error);
    }
  );

  // Deploying claim factory
  console.log("Deploying claim factory");
  const Factory = await ethers.getContractFactory("ClaimFactory");
  const factory_instance = await upgrades.deployProxy(
    Factory,
    [claim_instance.address, 0, 0, "0x89"],
    {
      initializer: "initialize"
    }
  );
  await factory_instance.deployed();
  console.log("Factory deployed to:", factory_instance.address);
  exec(
    `npx hardhat verify --network ${NETWORK} ${factory_instance.address}`,
    async (error, stdout, stderr) => {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      console.log(error);
    }
  );

  // Deploying claim emitter
  console.log("Deploying claim emitter");
  const Emitter = await ethers.getContractFactory("ClaimEmitter");
  const emitter_instance = await upgrades.deployProxy(
    Emitter,
    [factory_instance.address],
    {
      initializer: "initialize"
    }
  );
  await emitter_instance.deployed();
  console.log("Emitter deployed to:", emitter_instance.address);
  exec(
    `npx hardhat verify --network ${NETWORK} ${emitter_instance.address}`,
    async (error, stdout, stderr) => {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      console.log(error);
    }
  );

  // Setting emitter
  console.log("Setting emitter");
  await factory_instance.setEmitter(emitter_instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
