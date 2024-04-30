/* eslint-disable import/no-anonymous-default-export */
export const substrateConfig = {
  seed: "",
  endpoint: "wss://rpc-hex-devnet.avail.tools/ws",
  appId: 0,
}

import { http, createConfig } from '@wagmi/core'
import { sepolia } from '@wagmi/core/chains'

export const ethConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
})
