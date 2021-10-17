require('@nomiclabs/hardhat-waffle')
require('hardhat-abi-exporter')

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()
  for(const { address } of accounts) {
    console.log(address)
  }
})

const fs = require('fs')
const mnemonic = fs.readFileSync('private.mnemonic').toString().trim()

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  // defaultNetwork: 'matic-mumbai',
  defaultNetwork: 'rinkeby',
  networks: {
    hardhat: {
    },
    matic: {
      url: 'https://rpc-mainnet.matic.network',
      accounts: { mnemonic },
    },
    'matic-mumbai': {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: { mnemonic },
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/7ba21f9ee8d2422da87d1c35bcead48b',
      accounts: { mnemonic },
    },
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 20000,
  },
  abiExporter: {
    path: './src/contract/abi',
    spacing: 2,
    flat: true,
  },
}