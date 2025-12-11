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

  // Etherscan API v2 (single key, multichain)
  etherscan: {
    apiKey: process.env.MAINNET_BSCSCAN_API_KEY,
    customChains: [
      {
        network: "mainnet",
        chainId: 1,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=1",
          browserURL: "https://etherscan.com",
        },
      },
      {
        network: "bsc",
        chainId: 56,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=56",
          browserURL: "https://bscscan.com",
        },
      },
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api",
          browserURL: "https://testnet.bscscan.com",
        },
      },
    ],
  },

  defaultNetwork: "mainnet",

  networks: {
    hardhat: {
      chainId: 31337
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      chainId: 1,
      accounts: [process.env.PRIVATE_KEY]
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL,
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY]
    },
    bsc: {
      url: process.env.BSC_MAINNET_RPC_URL,
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};