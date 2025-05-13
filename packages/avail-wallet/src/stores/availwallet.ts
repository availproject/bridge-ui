import { Wallet, WalletAccount } from "@talismn/connect-wallets";
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AvailWallet {
  selected: WalletAccount | null;
  setSelected: (selected: WalletAccount | null) => void;
  selectedWallet: Wallet | null;
  setSelectedWallet: (selectedWallet: Wallet | null) => void;
  metadataUpdated: boolean;
  setMetadataUpdated: (updated: boolean) => void;
  clearWalletState: () => void;
}

export const useAvailAccount = create<AvailWallet>()(
  persist(
    (set) => ({
      selected: null,
      setSelected: (selected) => set({ selected }),
      selectedWallet: null,
      setSelectedWallet: (selectedWallet) => set({ selectedWallet }),
      metadataUpdated: false,
      setMetadataUpdated: (updated) => set({ metadataUpdated: updated }),
      clearWalletState: () => set({ 
        selected: null, 
        selectedWallet: null, 
        metadataUpdated: false 
      }),
    }),
    {
      name: 'avail-wallet-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selected: state.selected,
        selectedWallet: state.selectedWallet,
        metadataUpdated: state.metadataUpdated,
      }),
    }
  )
);
