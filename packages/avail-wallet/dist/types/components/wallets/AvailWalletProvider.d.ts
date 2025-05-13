import React from "react";
import { ApiPromise } from "avail-js-sdk";
import { AvailWalletProviderProps } from "../../types";
interface AvailWalletContextType {
    api?: ApiPromise;
    isConnected: boolean;
    rpcUrl?: string;
    setRpcUrl: (url: string) => void;
}
export declare const useAvailWallet: () => AvailWalletContextType;
export declare const AvailWalletProvider: React.FC<AvailWalletProviderProps & {
    rpcUrl?: string;
}>;
export {};
