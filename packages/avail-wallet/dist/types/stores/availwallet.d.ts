import { Wallet, WalletAccount } from "@talismn/connect-wallets";
interface AvailWallet {
    selected: WalletAccount | null;
    setSelected: (selected: WalletAccount | null) => void;
    selectedWallet: Wallet | null;
    setSelectedWallet: (selectedWallet: Wallet | null) => void;
    metadataUpdated: boolean;
    setMetadataUpdated: (updated: boolean) => void;
    clearWalletState: () => void;
}
export declare const useAvailAccount: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AvailWallet>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AvailWallet, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AvailWallet) => void) => () => void;
        onFinishHydration: (fn: (state: AvailWallet) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AvailWallet, unknown>>;
    };
}>;
export {};
