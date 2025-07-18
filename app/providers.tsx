"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { MetaMaskProvider } from "@/hooks/metamask";
import { config } from "@/config/walletConfig";
import { useEffect } from "react";
import { useApi } from "@/stores/api";
import { useCommonStore } from "@/stores/common";
import { SuccessDialog } from "@/components/common/successdialog";
import ErrorDialog from "@/components/common/error";
import { useLatestBlockInfo } from "@/stores/blockinfo";
import WarningDialog from "@/components/common/warning";
import { HumanBehaviorProvider } from "humanbehavior-js/react";
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const { ensureConnection, isReady } = useApi();
  const { fetchDollarAmount } = useCommonStore();
  const { fetchAllHeads } = useLatestBlockInfo();

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

  /** FETCH LATEST HEADS */
  useEffect(() => {
    if (isReady) {
      fetchAllHeads();
      const interval = setInterval(fetchAllHeads, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isReady]);

  return (
    <HumanBehaviorProvider apiKey="0e303358-824b-4fed-be07-76729b4dac68">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider>
            <MetaMaskProvider>
              <SuccessDialog />
              <ErrorDialog />
              <WarningDialog />
              {children}
            </MetaMaskProvider>
          </ConnectKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </HumanBehaviorProvider>
  );
}
