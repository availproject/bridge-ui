// Note: import the CSS file in your application with:
// import 'avail-wallet/dist/styles.css';

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

// Export test components
export { TestComponent } from "./test";
