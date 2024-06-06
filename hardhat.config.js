require("@nomiclabs/hardhat-ethers");
require("hardhat-abi-exporter");
require("@nomiclabs/hardhat-etherscan");
require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");
require("hardhat-contract-sizer");
require("@openzeppelin/hardhat-upgrades");

//Require .env
require("dotenv").config({ path: __dirname + "/.env" });

module.exports = {
  defaultNetwork: process.env.NETWORK,
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://api.basescan.org/api"
        }
      },
      {
        network: "linea",
        chainId: 59140,
        urls: {
          apiURL: "https://explorer.goerli.linea.build/api",
          browserURL: "https://explorer.goerli.linea.build/"
        }
      },
      {
        network: "linea_mainnet",
        chainId: 59144,
        urls: {
          apiURL: "https://api.lineascan.build/api",
          browserURL: "https://lineascan.build/"
        }
      },

      {
        network: "scroll",
        chainId: 534353,
        urls: {
          apiURL: "https://api.scrollscan.com/api",
          browserURL: "https://api.scrollscan.com/"
        }
      },
      {
        network: "mantle",
        chainId: 5001,
        urls: {
          apiURL: "https://explorer.testnet.mantle.xyz/api",
          browserURL: "https://explorer.testnet.mantle.xyz/"
        }
      },
      {
        network: "arbitrum",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io"
        }
      },
      {
        network: "bsc",
        chainId: 56,
        urls: {
          apiURL: "https://api.bscscan.com/api",
          browserURL: "https://bscscan.com/"
        }
      }
    ]
  },
  networks: {
    polygon: {
      url: process.env.POLYGON_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    gnosis: {
      url: process.env.GNOSIS_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    mantle: {
      url: process.env.MANTLE_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    base: {
      url: process.env.BASE_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    base: {
      url: process.env.BASE_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    linea: {
      url: process.env.LINEA_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    linea_mainnet: {
      url: process.env.LINEA_MAINNET_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    scroll: {
      url: process.env.SCROLL_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    goerli: {
      url: process.env.GOERLI_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    mainnet: {
      url: process.env.MAINNET_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    arbitrum: {
      url: process.env.ARBITRUM_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    bsc: {
      url: process.env.BSC_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY]
    },
    hardhat: {
      mining: {
        auto: true,
        interval: [3000, 6000]
      }
    }
  },
  solidity: {
    version: "0.8.18",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 5
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 20000
  },
  abiExporter: [
    {
      path: "./abi/json",
      runOnCompile: true,
      clear: true,
      flat: true,
      only: [
        "contracts/Frames.sol:Frames",
        "contracts/ClaimFactory.sol:ClaimFactory",
        "contracts/ClaimEmitter.sol:ClaimEmitter",
        "contracts/Claim.sol:Claim",
        "contracts/Disburse.sol:Disburse",
        "contracts/proxy.sol:ProxyContract"
      ],
      spacing: 2,
      format: "json"
    }
  ],
  plugins: ["solidity-coverage"],
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
    only: []
  },
  mocha: {
    timeout: 1000000000
  }
};
