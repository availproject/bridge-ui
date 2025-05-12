import type { MetaMaskInpageProvider } from '@metamask/providers';
declare global {
    interface Window {
        ethereum?: MetaMaskInpageProvider & {
            detected?: MetaMaskInpageProvider[];
            providers?: MetaMaskInpageProvider[];
        };
    }
}
/**
 * Check if the current provider supports snaps by calling `wallet_getSnaps`.
 */
export declare function hasSnapsSupport(provider?: MetaMaskInpageProvider): Promise<boolean>;
/**
 * Get a provider that supports snaps.
 */
export declare function getSnapsProvider(): Promise<MetaMaskInpageProvider | null>;
/**
 * Check if a snap ID is a local snap ID.
 */
export declare const isLocalSnap: (snapId: string) => boolean;
export declare const defaultSnapOrigin: string;
