import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiPromise } from 'avail-js-sdk';
import { useCookies } from 'react-cookie';
import { getWallets, WalletAccount } from '@talismn/connect-wallets';
import { MetaMaskProvider } from '../../hooks/metamask';
import { AvailWalletProviderProps, ExtendedWalletAccount } from '../../types';
import { useAvailAccount } from '../../stores/availwallet';
import { useApi } from '../../stores/api';
import { initApi } from '../../utils';

interface AvailWalletContextType {
  api?: ApiPromise;
  isConnected: boolean;
  rpcUrl?: string;
  setRpcUrl: (url: string) => void;
}

const AvailWalletContext = createContext<AvailWalletContextType>({
  isConnected: false,
  setRpcUrl: () => {}
});

export const useAvailWallet = () => useContext(AvailWalletContext);

export const AvailWalletProvider: React.FC<AvailWalletProviderProps> = ({ 
  children, 
  api: externalApi 
}) => {
  const [rpcUrl, setRpcUrl] = useState<string | undefined>(
    typeof window !== 'undefined' ? (window as any).AVAIL_RPC_URL : undefined
  );
  const [cookies, setCookie] = useCookies([
    "substrateAddress", 
    "substrateWallet", 
    "metadataUpdated"
  ]);
  
  const { 
    selected, 
    setSelected, 
    selectedWallet, 
    setSelectedWallet 
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
      if (!cookies.substrateAddress || !cookies.substrateWallet || !isReady) {
        return;
      }
      
      if (cookies.substrateWallet !== "MetamaskSnap") {
        const wallets = getWallets();
        const savedWallet = wallets.find(wallet => wallet.title === cookies.substrateWallet);
        
        if (!savedWallet) return;
        
        try {
          await savedWallet.enable("avail-wallet");
          const accounts = await savedWallet.getAccounts();
          const substrateAccounts = (accounts as ExtendedWalletAccount[])
            .filter(account => account.type !== "ethereum");
            
          const savedAccount = substrateAccounts.find(
            account => account.address === cookies.substrateAddress
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
  }, [cookies.substrateAddress, cookies.substrateWallet, isReady, setSelected, setSelectedWallet]);

  return (
    <MetaMaskProvider>
      <AvailWalletContext.Provider 
        value={{ 
          api: api,
          isConnected: isReady, 
          rpcUrl,
          setRpcUrl 
        }}
      >
        {children}
      </AvailWalletContext.Provider>
    </MetaMaskProvider>
  );
};