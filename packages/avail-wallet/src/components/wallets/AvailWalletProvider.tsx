// import useInitialise from "@/hooks/useInitialise";
import { getWallets } from "@talismn/connect-wallets";
import React, { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { MetaMaskProvider } from "../../hooks/metamask";
import { useApi } from "../../stores/api";
import { useAvailAccount } from "../../stores/availwallet";
import { AvailWalletProviderProps, ExtendedWalletAccount } from "../../types";

interface AvailWalletContextType {
  api?: any;
  isConnected: boolean;
  open:boolean
  setOpen:Dispatch<SetStateAction<boolean>>
  rpcUrl?: string;
  setRpcUrl: (url: string) => void;
}

const AvailWalletContext = createContext<AvailWalletContextType>({
  isConnected: false,
  setRpcUrl: () => {},
  open:false,
  setOpen:() => false
});

export const useAvailWallet = () => useContext(AvailWalletContext);

export const AvailWalletProvider: React.FC<
  AvailWalletProviderProps & { rpcUrl?: string }
> = ({ children, api: externalApi, rpcUrl: userProvidedRpcUrl }) => {
  const [rpcUrl, setRpcUrl] = useState<string>(
    userProvidedRpcUrl || "wss://turing-rpc.avail.so/"
  );
  const [open, setOpen] = useState(false);

  const { selected, setSelected, selectedWallet, setSelectedWallet } =
    useAvailAccount();
  // const { initializeApi } = useInitialise();

  const { api, isReady, setApi } = useApi();

  useEffect(() => {
    if (externalApi) {
      setApi(externalApi);
      return;
    }

    if (!rpcUrl) return;

    // initializeApi(rpcUrl);
  }, [rpcUrl, externalApi]);

  // Load persisted wallet data
  useEffect(() => {
    const loadPersistedWallet = async () => {
      if (!selected?.address || !selectedWallet?.title || !isReady) {
        return;
      }

      if (selectedWallet.title !== "MetamaskSnap") {
        const wallets = getWallets();
        const savedWallet = wallets.find(
          (wallet) => wallet.title === selectedWallet.title
        );

        if (!savedWallet) return;

        try {
          await savedWallet.enable("avail-wallet");
          const accounts = await savedWallet.getAccounts();
          const substrateAccounts = (
            accounts as ExtendedWalletAccount[]
          ).filter((account) => account.type !== "ethereum");

          const savedAccount = substrateAccounts.find(
            (account) => account.address === selected.address
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
  }, [selected, selectedWallet, isReady, setSelected, setSelectedWallet]);

  return (
    <MetaMaskProvider>
      <AvailWalletContext.Provider
        value={{
          api: api,
          isConnected: isReady,
          rpcUrl: rpcUrl,
          setRpcUrl,
          open,
          setOpen
        }}
      >
        {children}
      </AvailWalletContext.Provider>
    </MetaMaskProvider>
  );
};
