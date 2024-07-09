import { vars, type HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const BASESEPOLIA_KEY = vars.get("BASESEPOLIA_KEY");

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.4.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.8.26",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    bnbtestnet: {
      url: `https://api.zan.top/node/v1/bsc/testnet/public`,
      accounts: [PRIVATE_KEY],
      gasPrice: 8000000000,
    },
    basesepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/i05mxegOuaU4goDLCHtRCleHfK1TevYU`,
      accounts: [PRIVATE_KEY],
      gasPrice: 8000000000,
    },
    hardhat: {
      forking: {
        url: `https://base-sepolia.g.alchemy.com/v2/i05mxegOuaU4goDLCHtRCleHfK1TevYU`,
        enabled: true,
      },
    },
  },
  etherscan: {
    apiKey: BASESEPOLIA_KEY,
    customChains: [
      {
        network: "basesepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
  ignition: {
    requiredConfirmations: 1,
  },
};

export default config;
