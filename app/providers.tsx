"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider} from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

import { appConfig} from "@/config/default";
import { MetaMaskProvider } from "@/hooks/Metamask";
import { mainnet, sepolia } from "@wagmi/core/chains";
import { config } from "@/config/walletConfig";


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
