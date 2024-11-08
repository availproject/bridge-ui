/* eslint-disable import/no-anonymous-default-export */
export const substrateConfig = {
  seed: "",
  endpoint: process.env.NEXT_PUBLIC_AVAIL_RPC || "",
  appId: 0,
}

import { http, createConfig, createStorage } from '@wagmi/core'
import { appConfig } from './default'

console.log(appConfig.networks.ethereum.id === 1 ? process.env.ETHEREUM_RPC_URL : process.env.SEPOLIA_RPC_URL, appConfig.networks.ethereum.id, "addafd")

export const ethConfig = createConfig({
  chains: [appConfig.networks.ethereum],
  transports: {
    [appConfig.networks.ethereum.id]: http(appConfig.networks.ethereum.id ===  1 ? process.env.ETHEREUM_RPC_URL : process.env.SEPOLIA_RPC_URL),
  },
  ssr: true, 
})
