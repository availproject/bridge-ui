import React$1, { ReactNode } from 'react';
import { Wallet, WalletAccount } from '@talismn/connect-wallets';
import { ApiPromise } from 'avail-js-sdk';
import { MetaMaskInpageProvider } from '@metamask/providers';

type Snap$1 = {
    permissionName: string;
    id: string;
    version: string;
    initialPermissions: Record<string, unknown>;
};
interface WalletSelectionProps {
    supportedWallets: Wallet[];
    onWalletSelect: (wallet: Wallet) => void;
    metamaskInstalled: boolean;
}
interface AccountSelectionProps {
    selectedWallet: Wallet | null;
    enabledAccounts: WalletAccount[];
    onAccountSelect: (account: WalletAccount) => void;
}
interface DisconnectWalletProps {
    selected: WalletAccount | null;
    installedSnap?: Snap$1 | null;
    onDisconnect: () => void;
}
interface ExtendedWalletAccount extends WalletAccount {
    type?: string;
}
interface UpdateMetadataParams {
    api: ApiPromise | undefined;
    account: WalletAccount;
    metadataCookie: any;
    selectedWallet: Wallet;
    setCookie: Function;
}
interface AvailWalletProviderProps {
    children: React.ReactNode;
    api?: ApiPromise;
}
interface AvailWalletConnectProps {
    api?: ApiPromise;
}

declare const AvailWalletConnect: React$1.FC<AvailWalletConnectProps>;

declare const AccountSelector: React$1.MemoExoticComponent<({ selectedWallet, enabledAccounts, onAccountSelect }: AccountSelectionProps) => React$1.JSX.Element>;

declare const DisconnectWallet: React$1.MemoExoticComponent<({ selected, installedSnap, onDisconnect }: DisconnectWalletProps) => React$1.JSX.Element | null>;

declare const WalletSelector: React$1.MemoExoticComponent<({ supportedWallets, onWalletSelect, metamaskInstalled }: WalletSelectionProps) => React$1.JSX.Element>;

interface AvailWalletContextType {
    api?: ApiPromise;
    isConnected: boolean;
    rpcUrl?: string;
    setRpcUrl: (url: string) => void;
}
declare const useAvailWallet: () => AvailWalletContextType;
declare const AvailWalletProvider: React$1.FC<AvailWalletProviderProps>;

declare const useAvailAccount: any;

declare const useApi: any;

type MetaMaskContextType = {
    provider: MetaMaskInpageProvider | null;
    installedSnap: Snap | null;
    error: Error | null;
    setInstalledSnap: (snap: Snap | null) => void;
    setError: (error: Error) => void;
};
declare const MetaMaskContext: React$1.Context<MetaMaskContextType>;
/**
 * MetaMask context provider to handle MetaMask and snap status.
 *
 * @param props - React Props.
 * @param props.children - React component to be wrapped by the Provider.
 * @returns JSX.
 */
declare const MetaMaskProvider: ({ children }: {
    children: ReactNode;
}) => React$1.JSX.Element;
/**
 * Utility hook to consume the MetaMask context.
 *
 * @returns The MetaMask context.
 */
declare function useMetaMaskContext(): MetaMaskContextType;

type Snap = {
    permissionName: string;
    id: string;
    version: string;
    initialPermissions: Record<string, unknown>;
};
type InvokeSnapParams = {
    method: string;
    params?: Record<string, unknown>;
};
declare function useMetaMask(): {
    isFlask: boolean;
    snapsDetected: boolean;
    installedSnap: Snap | null;
    getSnap: () => Promise<void>;
    detectMetaMask: () => boolean;
    metamaskInstalled: boolean;
};
declare function useInvokeSnap(snapId?: string): ({ method, params }: InvokeSnapParams) => Promise<unknown>;
declare function useRequestSnap(snapId?: string, version?: string): () => Promise<void>;

/**
 * @description Get injected metadata for extrinsic call
 *
 * @param api
 * @returns injected metadata
 */
declare const getInjectorMetadata: (api: ApiPromise) => {
    chain: string;
    specVersion: number;
    tokenDecimals: number;
    tokenSymbol: string;
    genesisHash: `0x${string}`;
    ss58Format: number;
    chainType: "substrate";
    icon: string;
    types: any;
    userExtensions: any;
};
declare function updateMetadata({ api, account, metadataCookie, selectedWallet, setCookie }: UpdateMetadataParams): Promise<void>;
declare const initApi: (rpcUrl: string, retries?: number) => Promise<ApiPromise>;

export { AccountSelectionProps, AccountSelector, AvailWalletConnect, AvailWalletConnectProps, AvailWalletProvider, AvailWalletProviderProps, DisconnectWallet, DisconnectWalletProps, ExtendedWalletAccount, MetaMaskContext, MetaMaskProvider, UpdateMetadataParams, WalletSelectionProps, WalletSelector, getInjectorMetadata, initApi, updateMetadata, useApi, useAvailAccount, useAvailWallet, useInvokeSnap, useMetaMask, useMetaMaskContext, useRequestSnap };
