"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Web3OnboardProvider } from '@subwallet-connect/react'; 
import type { AppProps } from 'next/app';
import web3Onboard from "@/components/connections/web3Onboard"; 
 
 



const { wallets } = getDefaultWallets();

export const config = getDefaultConfig({
  appName: "Avail Bridge",
  projectId: "e77cdade22390c135f6dfb134f075abe",
  wallets: [
    ...wallets,
    {
      groupName: "Other",
      wallets: [argentWallet, trustWallet, ledgerWallet],
    },
  ],
  chains: [mainnet],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}> 
    <WagmiProvider config={config}> 
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
    </Web3OnboardProvider>
  );
}
