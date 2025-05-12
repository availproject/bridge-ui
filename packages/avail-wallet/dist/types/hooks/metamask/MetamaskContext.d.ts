import type { MetaMaskInpageProvider } from '@metamask/providers';
import type { ReactNode } from 'react';
import React from 'react';
import { Snap } from '../metamask';
type MetaMaskContextType = {
    provider: MetaMaskInpageProvider | null;
    installedSnap: Snap | null;
    error: Error | null;
    setInstalledSnap: (snap: Snap | null) => void;
    setError: (error: Error) => void;
};
export declare const MetaMaskContext: React.Context<MetaMaskContextType>;
/**
 * MetaMask context provider to handle MetaMask and snap status.
 *
 * @param props - React Props.
 * @param props.children - React component to be wrapped by the Provider.
 * @returns JSX.
 */
export declare const MetaMaskProvider: ({ children }: {
    children: ReactNode;
}) => React.JSX.Element;
/**
 * Utility hook to consume the MetaMask context.
 *
 * @returns The MetaMask context.
 */
export declare function useMetaMaskContext(): MetaMaskContextType;
export {};
