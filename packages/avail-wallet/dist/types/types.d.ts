import { Wallet, WalletAccount } from "@talismn/connect-wallets";
import { ApiPromise } from "avail-js-sdk";
export type { StoreApi } from 'zustand';
export type Snap = {
    permissionName: string;
    id: string;
    version: string;
    initialPermissions: Record<string, unknown>;
};
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
export interface UpdateMetadataParams {
    api: ApiPromise | undefined;
    account: WalletAccount;
    metadataCookie: boolean | any;
    selectedWallet: Wallet;
    setCookie: (name: string, value: any, options?: any) => void;
}
export interface AvailWalletProviderProps {
    children: React.ReactNode;
    api?: ApiPromise;
}
export interface AvailWalletConnectProps {
    api?: ApiPromise;
}
