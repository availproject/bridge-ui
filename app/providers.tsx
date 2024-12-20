"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider} from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { MetaMaskProvider } from "@/hooks/Metamask";
import { config } from "@/config/walletConfig";
import { useEffect } from "react";
import { useApiStore } from "@/stores/api";

const queryClient = new QueryClient();


export function Providers({ children }: { children: React.ReactNode }) {
  const { ensureConnection, isReady } = useApiStore();

  useEffect(() => {(async () => {
    await ensureConnection();
    
    const interval = setInterval(async () => {
      if (!isReady) {
        await ensureConnection();
      }
    }, 30000);
    return () => clearInterval(interval);
  })()
    
  }, []);

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
