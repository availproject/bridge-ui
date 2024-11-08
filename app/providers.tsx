"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider} from "wagmi";
import { ConnectKitProvider } from "connectkit";

import { appConfig, config } from "@/config/default";
import { MetaMaskProvider } from "@/hooks/Metamask";


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
export { config };

