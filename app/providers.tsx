"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider} from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

import { appConfig } from "@/config/default";
import { MetaMaskProvider } from "@/hooks/Metamask";
import { mainnet, sepolia } from "@wagmi/core/chains";


const queryClient = new QueryClient();

export const config = createConfig(
  getDefaultConfig({
    chains: [appConfig.networks.ethereum],
    transports: {
      [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ETHEREUM_RPC_API_KEY}` || ''),
      [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ETHEREUM_RPC_API_KEY}` || ''),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "e77cdade22390c135f6dfb134f075abe",
    appName: "Bridge UI",
    appDescription: "Official Avail Bridge between AVAIL and ETHEREUM",
    appIcon: "https://bridge.availproject.org/favicon.ico",
    ssr: true,
  }),
)


export function Providers({ children }: { children: React.ReactNode }) {
  
  return (
    <WagmiProvider config={config}> 
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
        <MetaMaskProvider>
          {children}
        </MetaMaskProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
