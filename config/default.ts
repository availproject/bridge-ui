import { Chain } from 'viem'
import { mainnet, sepolia } from '@wagmi/core/chains'
import { createConfig, http } from "wagmi";
import { getDefaultConfig } from 'connectkit';

type AppConfig = {
    networks: {
        ethereum: Chain,
    },
    bridgeApiBaseUrl: string,
    bridgeIndexerBaseUrl: string,
    bridgeIndexerPollingInterval: number,
    bridgePricePollingInterval: number,
    bridgeHeadsPollingInterval: number,
    contracts: {
        ethereum: {
            availToken: string,
            bridge: string,
        },
        avail: {
            availToken: string,
            bridge: string,
        }
    },
}

export const appConfig: AppConfig = {
    networks: {
    ethereum: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK === 'mainnet' ? mainnet : sepolia,
    },
    bridgeApiBaseUrl: process.env.NEXT_PUBLIC_BRIDGE_API_URL || 'http://0.0.0.0:8080',
    bridgeIndexerBaseUrl: process.env.NEXT_PUBLIC_BRIDGE_INDEXER_URL ||'http://167.71.41.169:3000',
    bridgeIndexerPollingInterval: 30, // in seconds
    bridgeHeadsPollingInterval: 600, // in seconds
    bridgePricePollingInterval: 60,
    contracts: {
        ethereum: {
            availToken: process.env.NEXT_PUBLIC_TOKEN_CONTRACT || '',
            bridge: process.env.NEXT_PUBLIC_BRIDGE_PROXY_CONTRACT || '',
        },
        avail: {
            availToken: '',
            bridge: '',
        }
    }
};

export const config = createConfig(
    getDefaultConfig({
      chains: [appConfig.networks.ethereum],
      transports: {
        [mainnet.id]: http(process.env.ETHEREUM_RPC_URL || ''),
        [sepolia.id]: http(process.env.SEPOLIA_RPC_URL || ''),
      },
      walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "e77cdade22390c135f6dfb134f075abe",
      appName: "Bridge UI",
      appDescription: "Official Avail Bridge between AVAIL and ETHEREUM",
      appIcon: "https://bridge.availproject.org/favicon.ico",
      ssr: true,
    }),
  )


