"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider} from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { MetaMaskProvider } from "@/hooks/Metamask";
import { config } from "@/config/walletConfig";
import { Initialize } from "@/components/common/initialise";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {


  return (
    <WagmiProvider config={config}> 
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
        <MetaMaskProvider>
        <Initialize/>
          {children}     
        </MetaMaskProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
