/* eslint-disable import/no-anonymous-default-export */
export const substrateConfig = {
  seed: "",
  endpoint: process.env.NEXT_PUBLIC_AVAIL_RPC || "",
  appId: 0,
}

import { http, createConfig } from '@wagmi/core'
import { appConfig } from './default'
import { getDefaultConfig } from 'connectkit'
import { mainnet, sepolia } from '@wagmi/core/chains'


export const config = createConfig(
  getDefaultConfig({
    chains: [appConfig.networks.ethereum],
    transports: {
      [mainnet.id]: http(process.env.NEXT_PUBLIC_ETHEREUM_RPC || ""),
      [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || ""),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "e77cdade22390c135f6dfb134f075abe",
    appName: "Bridge UI",
    appDescription: "Official Avail Bridge between AVAIL and ETHEREUM",
    appIcon: "https://bridge.availproject.org/favicon.ico",
    ssr: true,
  }),
)

