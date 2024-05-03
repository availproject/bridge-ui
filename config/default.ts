import { Chain } from 'viem'
import { sepolia } from '@wagmi/core/chains'

type AppConfig = {
    networks: {
        ethereum: Chain,
    },
    bridgeApiBaseUrl: string,
    bridgeIndexerBaseUrl: string,
    bridgeIndexerPollingInterval: number,
    contracts: {
        ethereum: {
            availToken: string,
            bridge: string,
        },
        avail: {
            availToken: string,
            bridge: string,
        }
    }
}

export const appConfig: AppConfig = Object.freeze({
    networks: {
        ethereum: sepolia,
    },
    bridgeApiBaseUrl: 'http://0.0.0.0:8080',
    bridgeIndexerBaseUrl: 'http://167.71.41.169:3000',
    bridgeIndexerPollingInterval: 30, // in seconds
    contracts: {
        ethereum: {
            availToken: '0xb1C3Cb9b5e598d4E95a85870e7812B99f350982d',
            bridge: '0x967F7DdC4ec508462231849AE81eeaa68Ad01389',
        },
        avail: {
            availToken: '',
            bridge: '',
        }
    }
});
