/* eslint-disable import/no-anonymous-default-export */
export const substrateConfig = {
  seed: "",
  endpoint: process.env.NEXT_PUBLIC_AVAIL_RPC || "",
  appId: 0,
}

import { http, createConfig, createStorage } from '@wagmi/core'
import { appConfig } from './default'


export const ethConfig = createConfig({
  chains: [appConfig.networks.ethereum],
  transports: {
    [appConfig.networks.ethereum.id]: http(),
  },
  ssr: true,
})
