import "./styles.css";
export { Button } from "./components/ui/Button";
export { Badge } from "./components/ui/Badge";
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, } from "./components/ui/Dialog";
export { AvailWalletConnect } from "./components/wallets/AvailWalletConnect";
export { AccountSelector } from "./components/wallets/AccountSelector";
export { DisconnectWallet } from "./components/wallets/DisconnectWallet";
export { WalletSelector } from "./components/wallets/WalletSelector";
export { AvailWalletProvider, useAvailWallet, } from "./components/wallets/AvailWalletProvider";
export { useAvailAccount } from "./stores/availwallet";
export { useApi } from "./stores/api";
export { MetaMaskContext, MetaMaskProvider, useMetaMaskContext, useInvokeSnap, useMetaMask, useRequestSnap, } from "./hooks/metamask";
export declare const ASSETS_PATH: {
    fonts: {
        PPMoriRegular: string;
        PPMoriSemiBold: string;
        ThicccboiBold: string;
        ThicccboiMedium: string;
        ThicccboiRegular: string;
        ThicccboiSemiBold: string;
    };
    images: {
        availSnap: string;
    };
};
export type { UpdateMetadataParams, WalletSelectionProps, AccountSelectionProps, DisconnectWalletProps, ExtendedWalletAccount, AvailWalletProviderProps, AvailWalletConnectProps, } from "./types";
export { updateMetadata, getInjectorMetadata, initApi } from "./utils";
