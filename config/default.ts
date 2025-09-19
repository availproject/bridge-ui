import { Chain } from "viem";
import { base, baseSepolia, mainnet, sepolia } from "@wagmi/core/chains";

type AppConfig = {
  assetId: string;
  config: string;
  networks: {
    ethereum: Chain;
    base: Chain;
  };
  bridgeApiBaseUrl: string;
  bridgeIndexerBaseUrl: string;
  bridgeIndexerPollingInterval: number;
  bridgePricePollingInterval: number;
  bridgeHeadsPollingInterval: number;
  liquidityBridgeApiBaseUrl: string;
  bridgeLimits: {
    baseAvail: {
      min: number;
      max: number;
    };
  };
  contracts: {
    ethereum: {
      liquidityBridgeAddress: string;
      availToken: string;
      bridge: string;
      manager: string;
      transceiver: {
        wormhole: string;
        pauser: string;
      };
    };
    base: {
      liquidityBridgeAddress: string;
      availToken: string;
      manager: string;
      transceiver: {
        wormhole: string;
        pauser: string;
      };
    };
    avail: {
      liquidityBridgeAddress: string;
    };
  };
};

export const appConfig: AppConfig = {
  assetId: "0x0000000000000000000000000000000000000000000000000000000000000000",
  config: process.env.NEXT_PUBLIC_ETH_NETWORK || "testnet",
  networks: {
    ethereum:
      process.env.NEXT_PUBLIC_ETH_NETWORK === "mainnet" ? mainnet : sepolia,
    base:
      process.env.NEXT_PUBLIC_ETH_NETWORK === "mainnet" ? base : baseSepolia,
  },
  bridgeApiBaseUrl:
    process.env.NEXT_PUBLIC_BRIDGE_API_URL || "http://0.0.0.0:8080",
  liquidityBridgeApiBaseUrl:
    process.env.NEXT_PUBLIC_LIQUIDITY_BRIDGE_API_URL ||
    "https://turing-liquidity-bridge.fra.avail.so",
  bridgeIndexerBaseUrl:
    process.env.NEXT_PUBLIC_BRIDGE_INDEXER_URL || "http://167.71.41.169:3000",
  bridgeIndexerPollingInterval: 30,
  bridgeHeadsPollingInterval: 600,
  bridgePricePollingInterval: 60,
  bridgeLimits: {
    baseAvail: {
      min: Number(process.env.NEXT_PUBLIC_BASE_AVAIL_MIN_AMOUNT) || 1,
      max: Number(process.env.NEXT_PUBLIC_BASE_AVAIL_MAX_AMOUNT) || 5000,
    },
  },
  contracts: {
    ethereum: {
      liquidityBridgeAddress:
        process.env.NEXT_PUBLIC_LP_ADDRESS_ETH ||
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      availToken:
        process.env.NEXT_PUBLIC_AVAIL_TOKEN_ETH ||
        "0xb1c3cb9b5e598d4e95a85870e7812b99f350982d",
      bridge:
        process.env.NEXT_PUBLIC_BRIDGE_PROXY_ETH ||
        "0x967F7DdC4ec508462231849AE81eeaa68Ad01389",
      manager:
        process.env.NEXT_PUBLIC_MANAGER_ADDRESS_ETH ||
        "0x40E856FD3eCBeE56c33388738f0B1C3aad573353",
      transceiver: {
        wormhole:
          process.env.NEXT_PUBLIC_WORMHOLE_TRANSCEIVER_ETH ||
          "0x988140794D960fD962329751278Ef0DD2438a64C",
        pauser:
          process.env.NEXT_PUBLIC_PAUSER_ETH ||
          "0x0f62A884eDAbD338e92302274e7cE7Cc1D467B74",
      },
    },
    base: {
      liquidityBridgeAddress:
        process.env.NEXT_PUBLIC_LP_ADDRESS_BASE ||
        "0xB5449eB18eD134368dE025Fa0F96A57F68Efe102",
      availToken:
        process.env.NEXT_PUBLIC_AVAIL_TOKEN_BASE ||
        "0xf50F2B4D58ce2A24b62e480d795A974eD0f77A58",
      manager:
        process.env.NEXT_PUBLIC_MANAGER_ADDRESS_BASE ||
        "0xf4B55457fCD2b6eF6ffd41E5F5b0D65fbE370EA3",
      transceiver: {
        wormhole:
          process.env.NEXT_PUBLIC_WORMHOLE_TRANSCEIVER_BASE ||
          "0xAb9C68eD462f61Fd5fd34e6c21588513d89F603c",
        pauser:
          process.env.NEXT_PUBLIC_PAUSER_BASE ||
          "0x0f62A884eDAbD338e92302274e7cE7Cc1D467B74",
      },
    },
    avail: {
      liquidityBridgeAddress:
        process.env.NEXT_PUBLIC_LP_ADDRESS_AVAIL ||
        "5Hn8x2fstQmcqLg4C8pEiLWdAJhGaRv8jfYRUrnHeiMALvAX",
    },
  },
};
