"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { MetaMaskProvider } from "@/hooks/metamask";
import { config } from "@/config/walletConfig";
import { use, useEffect } from "react";
import { useApi } from "@/stores/api";
import { useCommonStore } from "@/stores/common";
import { SuccessDialog } from "@/components/common/successdialog";
import ErrorDialog from "@/components/common/errordialog";
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const { ensureConnection, isReady } = useApi();
  const { fetchDollarAmount } = useCommonStore();

  /** FETCH AND POLL AVAIL API */
  useEffect(() => {
    (async () => {
      await ensureConnection();

      const interval = setInterval(async () => {
        if (!isReady) {
          await ensureConnection();
        }
      }, 30000);
      return () => clearInterval(interval);
    })();
  }, [ensureConnection, isReady]);

  /** FETCH AND POLL DOLLAR AMOUNT */
  useEffect(() => {
    (async () => {
       await fetchDollarAmount();

      const interval = setInterval(async () => {
        await fetchDollarAmount();
      }, 30000);
      return () => clearInterval(interval);
    })();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <MetaMaskProvider>
          <SuccessDialog/>
          <ErrorDialog/>
          {children}</MetaMaskProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
