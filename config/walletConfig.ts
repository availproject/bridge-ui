/* eslint-disable import/no-anonymous-default-export */
export const substrateConfig = {
  seed: "",
  endpoint: process.env.NEXT_PUBLIC_AVAIL_RPC || "",
  appId: 0,
}

import { http, createConfig } from '@wagmi/core'
import { appConfig } from './default'


export const ethConfig = createConfig({
  chains: [appConfig.networks.ethereum],
  transports: {
    [appConfig.networks.ethereum.id]: http(appConfig.networks.ethereum.id ===  1 ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ETHEREUM_RPC_API_KEY}` : `https://eth-sepolia.g.alchemy.com/v2/${process.env.ETHEREUM_RPC_API_KEY}`),
  },
  ssr: true, 
})