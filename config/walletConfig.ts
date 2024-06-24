/* eslint-disable import/no-anonymous-default-export */
export const substrateConfig = {
  seed: "",
  endpoint: "wss://turing-rpc.avail.so/ws",
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
