import { Snap } from "@/hooks/Metamask/types";
import { Wallet, WalletAccount } from "@talismn/connect-wallets";

export interface WalletSelectionProps {
  supportedWallets: Wallet[];
  onWalletSelect: (wallet: Wallet) => void;
  metamaskInstalled: boolean;
}

export interface AccountSelectionProps {
  selectedWallet: Wallet | null;
  enabledAccounts: WalletAccount[];
  onAccountSelect: (account: WalletAccount) => void;
}

export interface DisconnectWalletProps {
  selected: WalletAccount | null;
  installedSnap?: Snap | null;
  onDisconnect: () => void;
}

export interface ExtendedWalletAccount extends WalletAccount {
    type?: string;
}
