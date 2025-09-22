require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require('@primitivefi/hardhat-dodoc');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  dodoc: {
    runOnCompile: false,
    debugMode: false,
    exclude: ['@openzeppelin/contracts-upgradeable'],
    outputDir: './docs',
  },

  etherscan: {
    apiKey: {
      bscTestnet: process.env.TESTNET_BSCSCAN_API_KEY,
      bsc: process.env.MAINNET_BSCSCAN_API_KEY,
    }
  },

  defaultNetwork: "bsc",

  networks: {
    hardhat: {
      chainId: 31337
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL,
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY]
    },
    bsc: {
      url: "https://bsc.drpc.org",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};