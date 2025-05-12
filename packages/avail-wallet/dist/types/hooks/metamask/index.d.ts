import { MetaMaskContext, MetaMaskProvider, useMetaMaskContext } from './MetamaskContext';
export type Snap = {
    permissionName: string;
    id: string;
    version: string;
    initialPermissions: Record<string, unknown>;
};
export type GetSnapsResponse = Record<string, Snap>;
export type InvokeSnapParams = {
    method: string;
    params?: Record<string, unknown>;
};
export type Request = (params: {
    method: string;
    params?: any;
}) => Promise<unknown | null>;
export declare const defaultSnapOrigin: string;
export { MetaMaskContext, MetaMaskProvider, useMetaMaskContext };
export declare function useRequest(): Request;
export declare function useMetaMask(): {
    isFlask: boolean;
    snapsDetected: boolean;
    installedSnap: Snap | null;
    getSnap: () => Promise<void>;
    detectMetaMask: () => boolean;
    metamaskInstalled: boolean;
};
export declare function useInvokeSnap(snapId?: string): ({ method, params }: InvokeSnapParams) => Promise<unknown>;
export declare function useRequestSnap(snapId?: string, version?: string): () => Promise<void>;
