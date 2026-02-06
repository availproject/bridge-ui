"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { MetaMaskProvider } from "@/hooks/metamask";
import { config } from "@/config/walletConfig";
import { useEffect, useState } from "react";
import { useApi } from "@/stores/api";
import { SuccessDialog } from "@/components/common/successdialog";
import ErrorDialog from "@/components/common/error";
import { useLatestBlockInfo } from "@/stores/blockinfo";
import WarningDialog from "@/components/common/warning";
import { HumanBehaviorProvider } from "humanbehavior-js/react";
import { useBlockHeadsQuery } from "@/hooks/queries/useBlockHeadsQuery";

function BlockHeadSync() {
  const { data } = useBlockHeadsQuery();
  const { setEthHead, setAvlHead, setLoading } = useLatestBlockInfo();

  useEffect(() => {
    if (data) {
      setEthHead(data.ethHead);
      setAvlHead(data.avlHead);
      setLoading(false);
    }
  }, [data, setEthHead, setAvlHead, setLoading]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const { ensureConnection, isReady } = useApi();

  useEffect(() => {
    ensureConnection();
  }, [ensureConnection]);

  return (
    <HumanBehaviorProvider apiKey="0e303358-824b-4fed-be07-76729b4dac68">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider>
            <MetaMaskProvider>
              <BlockHeadSync />
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
