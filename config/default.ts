export const appConfig = Object.freeze({
    networks: {
        ethereum: {
            networkId: 11155111,
            name: 'Sepolia',
            symbol: 'ETH',
            decimals: 18,
        },
        avail: {
            networkId: 2,
            name: 'Avail Goldberg',
            symbol: 'AVAIL',
            decimals: 18,
        }
    },
    bridgeApiBaseUrl: 'https://hex-bridge-api.sandbox.avail.tools',
    bridgeIndexerBaseUrl: 'https://hex-bridge-indexer.sandbox.avail.tools',
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
