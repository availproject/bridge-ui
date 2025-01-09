/* eslint-disable import/no-anonymous-default-export */


import { http, createConfig } from '@wagmi/core'
import { appConfig } from './default'
import { getDefaultConfig } from 'connectkit'


export const substrateConfig = {
  endpoint: process.env.NEXT_PUBLIC_AVAIL_RPC || "",
}

export const config = createConfig(
  getDefaultConfig({
    chains: [appConfig.networks.ethereum, appConfig.networks.base],
    transports: {
   [appConfig.networks.ethereum.id]: http(process.env.NEXT_PUBLIC_ETH_RPC_URL || "" ),
   [appConfig.networks.base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "" ),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "e77cdade22390c135f6dfb134f075abe",
    appName: "Bridge UI",
    appDescription: "Official UI for the Avail Bridge",
    appIcon: "https://bridge.availproject.org/favicon.ico",
    ssr: true,
  }),
)

