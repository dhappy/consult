require('@nomiclabs/hardhat-waffle')
require('hardhat-abi-exporter')
require("@nomiclabs/hardhat-etherscan")
const fs = require('fs')
require('dotenv').config(
  { path: `${__dirname}/.env` }
)

task(
  'accounts',
  'Prints the list of accounts',
  async (_args, hre) => {
    const accounts = await hre.ethers.getSigners()
    const { provider } = hre.waffle
    await Promise.all(
      accounts.map(async ({ address: addr }) => {
        const balance = (
          hre.ethers.utils.formatUnits(
            await provider.getBalance(addr),
            "ether",
          )
        )
        console.info(`${addr}: ${balance}`)
      })
    )
  },
)

const mnemonic = (
  fs.readFileSync('private.mnemonic')
  .toString()
  .trim()
)

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
      url: process.env.RINKEBY_RPC_URL,
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
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
}