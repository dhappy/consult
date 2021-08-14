#!/usr/bin/env node
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat')
const fs = require('fs')
const OUT = 'src/contract/address.json'

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const IDXPub = await (
    hre.ethers.getContractFactory('IDXEndpointPublisher')
  )
  const publisher = await IDXPub.deploy()

  await publisher.deployed()

  const address = { address: publisher.address }
  fs.writeFile(
    OUT,
    JSON.stringify(address, null, 2),
    (err) => {
      if(err) {
        console.error(err)
      }
    },
  )
  console.log(`Saved contract address ${publisher.address} to ${OUT}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
})
