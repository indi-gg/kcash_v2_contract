import { HardhatUserConfig } from "hardhat/config";
// import "hardhat-abi-exporter";
// import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
// import "hardhat-deploy";
// import "hardhat-tracer";
// import "hardhat-contract-sizer";
// import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter"
// import "@nomiclabs/hardhat-web3";
// import "hardhat-gui"
import * as dotenv from "dotenv";
// import "hardhat-docgen"
// import 'hardhat-contract-clarity'
// import "hardhat-insight";


dotenv.config({ path: __dirname + "/.env" });
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    goerli: {
      chainId: 5,
      url: "https://rpc.ankr.com/eth_goerli",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    mainnet: {
      chainId: 1,
      url: "https://eth-mainnet.g.alchemy.com/v2/cz4JcV3d4nIRcZSSR71Zrcalh1PDyxcj",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    polygon: {
      chainId: 137,
      url: "https://rpc.ankr.com/polygon/",
      accounts: [process.env.PRIVATE_KEY || ""],
      // saveDeployments: true,
    },
    polygonMumbai: {
      chainId: 80001,
      url: "https://rpc.ankr.com/polygon_mumbai/",
      accounts: [process.env.PRIVATE_KEY || ""],
      // saveDeployments: true,
      timeout: 1000000,
    },
    zkEVMTest: {
      chainId: 1442,
      url: `https://rpc.public.zkevm-test.net`,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io/" || "",
      accounts: [process.env.PRIVATE_KEY || ""],
      gasPrice: 1000000000
    },
    'base-goerli': {
      url: 'https://goerli.base.org',
      accounts: [process.env.PRIVATE_KEY || ""]
    },
    mantleTest: {
      url: "https://rpc.testnet.mantle.xyz",
      accounts: [process.env.PRIVATE_KEY || ""]
    },
    arbitrumSepolia: {
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
      accounts: [process.env.PRIVATE_KEY || ""]
    },
    'haqq-test': {
      url: 'https://rpc.eth.testedge2.haqq.network',
      accounts: [process.env.PRIVATE_KEY || ""]
    },
    "blast_sepolia": {
      url: "https://sepolia.blast.io",
      accounts: [process.env.PRIVATE_KEY || ""]
    },

  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: "QFZE642XXV4YANFUCC3MQ3NERX6XH1UXAV",
      polygon: "QFZE642XXV4YANFUCC3MQ3NERX6XH1UXAV",
      goerli: "7TMQDQN93WFJ6Y9IGK7GAPJCQK8WSH6YMT",
      mainnet: "7TMQDQN93WFJ6Y9IGK7GAPJCQK8WSH6YMT",
      zkEVMTest: "C7546JVE9YTJD37SBGFK5S1UJ8DJQ126VY",
      scrollSepolia: "48EQKFV3BTGJN8DRY4E2UNMMYZIITYFSPY",
      'base-goerli': "7M6RR9S9IKPD8NPWKS31WJKBEGMJ7DSFEU",
      mantleTest: '7TMQDQN93WFJ6Y9IGK7GAPJCQK8WSH6YMT',
      arbitrumSepolia: "D9GTGHZAGBC6113J2AWP7A88J9YM9QINKN",
      "blast_sepolia": "blast_sepolia",
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/"
        }
      },
      {
        network: "zkEVMTest",
        chainId: 1442,
        urls: {
          apiURL: "https://api-testnet-zkevm.polygonscan.com/api",
          browserURL: "https://testnet-zkevm.polygonscan.com/"
        }
      },
      {
        network: 'scrollSepolia',
        chainId: 534351,
        urls: {
          apiURL: 'https://api-sepolia.scrollscan.com/api',
          browserURL: 'https://sepolia-blockscout.scroll.io/',
        },
      },
      {
        network: 'base-goerli',
        chainId: 84531,
        urls: {
          apiURL: 'https://api-goerli.basescan.org/api',
          browserURL: 'https://goerli.basescan.org/',
        },
      },
      {
        network: "mantleTest",
        chainId: 5001,
        urls: {
          apiURL: "https://explorer.testnet.mantle.xyz/api",
          browserURL: "https://explorer.testnet.mantle.xyz"
        }
      },
      {
        network: "haqq-test",
        chainId: 54211,
        urls: {
          apiURL: "https://api.haqq-testnet.com/api",
          browserURL: "https://haqq-testnet.com"

        }
      },
      {
        network: "blast_sepolia",
        chainId: 168587773,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/168587773/etherscan",
          browserURL: "https://testnet.blastscan.io"
        }
      }
    ]
  },


  gasReporter: {
    // gasPriceApi: "https://api.etherscan.com/api?module=proxy&action=eth_gasPrice",
    enabled: true,
    outputFile: "gas-report-optimism.txt",
    currency: "USD",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: "OP",
    currencyDisplayPrecision: 6,
    L2:"optimism"

    // gasPrice: 200

  },
};
export default config;