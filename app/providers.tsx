"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

import { appConfig } from "@/config/default";
import { MetaMaskProvider } from "@/hooks/Metamask";

export const config = createConfig(
  getDefaultConfig({
    chains: [appConfig.networks.ethereum],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "e77cdade22390c135f6dfb134f075abe",
    appName: "Bridge UI",
    appDescription: "Official Avail Bridge between AVAIL and ETHEREUM",
    appIcon: "https://bridge.availproject.org/favicon.ico",
    ssr: true,
  }),
);

const queryClient = new QueryClient();

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
