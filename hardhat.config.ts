import { configVariable, defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";
dotenv.config();
export default defineConfig({
  plugins: [hardhatEthers, hardhatToolboxMochaEthers],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
  hardhat: {
    type: "edr-simulated",
    chainId: 1337,
  },
  sepolia: {
    type: "http",
    chainType: "l1",
    url: process.env.SEPOLIA_RPC_URL as string,
    accounts: [process.env.SEPOLIA_PRIVATE_KEY as string],
  },
},
});