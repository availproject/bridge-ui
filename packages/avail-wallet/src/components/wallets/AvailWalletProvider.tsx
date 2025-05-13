import React, { createContext, useContext, useState, useEffect } from "react";
import { ApiPromise } from "avail-js-sdk";
import { getWallets } from "@talismn/connect-wallets";
import { MetaMaskProvider } from "../../hooks/metamask";
import { AvailWalletProviderProps, ExtendedWalletAccount } from "../../types";
import { useAvailAccount } from "../../stores/availwallet";
import { useApi } from "../../stores/api";
import { initApi } from "../../utils";

interface AvailWalletContextType {
  api?: ApiPromise;
  isConnected: boolean;
  rpcUrl?: string;
  setRpcUrl: (url: string) => void;
}

const AvailWalletContext = createContext<AvailWalletContextType>({
  isConnected: false,
  setRpcUrl: () => {},
});

export const useAvailWallet = () => useContext(AvailWalletContext);

export const AvailWalletProvider: React.FC<
  AvailWalletProviderProps & { rpcUrl?: string }
> = ({ children, api: externalApi, rpcUrl: userProvidedRpcUrl }) => {
  const DEFAULT_RPC_URL = "wss://turing-rpc.avail.so/";
  const [rpcUrl, setRpcUrl] = useState<string>(
    userProvidedRpcUrl || DEFAULT_RPC_URL,
  );

  const { 
    selected, 
    setSelected, 
    selectedWallet, 
    setSelectedWallet,
    metadataUpdated 
  } = useAvailAccount();

  const { api, isReady, setApi, ensureConnection } = useApi();

  // Initialize API
  useEffect(() => {
    if (externalApi) {
      setApi(externalApi);
      return;
    }

    if (!rpcUrl) return;

    const initializeApi = async () => {
      await ensureConnection(() => initApi(rpcUrl));
    };

    initializeApi();
  }, [rpcUrl, externalApi, setApi, ensureConnection]);

  // Load persisted wallet data
  useEffect(() => {
    const loadPersistedWallet = async () => {
      if (!selected?.address || !selectedWallet?.title || !isReady) {
        return;
      }

      if (selectedWallet.title !== "MetamaskSnap") {
        const wallets = getWallets();
        const savedWallet = wallets.find(
          (wallet) => wallet.title === selectedWallet.title,
        );

        if (!savedWallet) return;

        try {
          await savedWallet.enable("avail-wallet");
          const accounts = await savedWallet.getAccounts();
          const substrateAccounts = (
            accounts as ExtendedWalletAccount[]
          ).filter((account) => account.type !== "ethereum");

          const savedAccount = substrateAccounts.find(
            (account) => account.address === selected.address,
          );

          if (savedAccount) {
            setSelectedWallet(savedWallet);
            setSelected(savedAccount);
          }
        } catch (error) {
          console.error("Failed to reconnect wallet:", error);
        }
      }
    };

    loadPersistedWallet();
  }, [
    selected,
    selectedWallet,
    isReady,
    setSelected,
    setSelectedWallet,
  ]);

  return (
    <MetaMaskProvider>
      <AvailWalletContext.Provider
        value={{
          api: api,
          isConnected: isReady,
          rpcUrl: rpcUrl,
          setRpcUrl,
        }}
      >
        {children}
      </AvailWalletContext.Provider>
    </MetaMaskProvider>
  );
};
