export const appConfig = Object.freeze({
    networks: {
        ethereum: {
            networkId: 1,
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
            avail: '0xa5a871723D0a70CddfF57f938F4C06Fc70632EEc',
            bridge: '',
        },
        avail: {
            avail: '',
            bridge: '',
        }
    }
});
