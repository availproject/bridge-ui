/// <reference path="./declarations.d.ts" />
import "./styles.css";
import availSnap from "./assets/images/availsnap.png";

export { Button } from "./components/ui/Button";
export { Badge } from "./components/ui/Badge";
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./components/ui/Dialog";

export { AvailWalletConnect } from "./components/wallets/AvailWalletConnect";
export { AccountSelector } from "./components/wallets/AccountSelector";
export { DisconnectWallet } from "./components/wallets/DisconnectWallet";
export { WalletSelector } from "./components/wallets/WalletSelector";
export {
  AvailWalletProvider,
  useAvailWallet,
} from "./components/wallets/AvailWalletProvider";
// CookiesProviderWrapper has been deprecated in favor of local storage persistence
export { useAvailAccount } from "./stores/availwallet";
export { useApi } from "./stores/api";
export {
  MetaMaskContext,
  MetaMaskProvider,
  useMetaMaskContext,
  useInvokeSnap,
  useMetaMask,
  useRequestSnap,
} from "./hooks/metamask";

// Export assets path for bundled assets
export const ASSETS_PATH = {
  fonts: {
    PPMoriRegular: "./assets/fonts/PPMori-Regular.otf",
    PPMoriSemiBold: "./assets/fonts/PPMori-SemiBold.otf",
    ThicccboiBold: "./assets/fonts/THICCCBOI-Bold.woff2",
    ThicccboiMedium: "./assets/fonts/THICCCBOI-Medium.woff2",
    ThicccboiRegular: "./assets/fonts/THICCCBOI-Regular.otf",
    ThicccboiSemiBold: "./assets/fonts/THICCCBOI-SemiBold.otf",
  },
  images: {
    availSnap,
  },
};

export type {
  UpdateMetadataParams,
  WalletSelectionProps,
  AccountSelectionProps,
  DisconnectWalletProps,
  ExtendedWalletAccount,
  AvailWalletProviderProps,
  AvailWalletConnectProps,
} from "./types";
export { updateMetadata, getInjectorMetadata, initApi } from "./utils";