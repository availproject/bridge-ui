import { WalletAccount } from "@talismn/connect-wallets";
import { create } from "zustand";

interface AvailWallet {
  selected: WalletAccount | null;
  setSelected: (selected: WalletAccount | null) => void;
  selectedWallet: any;
  setSelectedWallet: (selectedWallet: any) => void;
}

export const useAvailAccount = create<AvailWallet>((set) => ({
  selected: null,
  setSelected: (selected) => set({ selected }),
  selectedWallet: null,
  setSelectedWallet: (selectedWallet) => set({ selectedWallet }),
}));
