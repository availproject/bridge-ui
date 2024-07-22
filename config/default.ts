import { Chain } from 'viem'
import { mainnet, sepolia } from '@wagmi/core/chains'

type AppConfig = {
    networks: {
        ethereum: Chain,
    },
    bridgeApiBaseUrl: string,
    bridgeIndexerBaseUrl: string,
    bridgeIndexerPollingInterval: number,
    bridgePricePollingInterval: number,
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
