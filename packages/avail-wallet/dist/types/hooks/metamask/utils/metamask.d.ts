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
 *
 * @param provider - The provider to use to check for snaps support. Defaults to
 * `window.ethereum`.
 * @returns True if the provider supports snaps, false otherwise.
 */
export declare function hasSnapsSupport(provider?: MetaMaskInpageProvider): Promise<boolean>;
/**
 * Get a MetaMask provider using EIP6963. This will return the first provider
 * reporting as MetaMask. If no provider is found after 500ms, this will
 * return null instead.
 *
 * @returns A MetaMask provider if found, otherwise null.
 */
export declare function getMetaMaskEIP6963Provider(): Promise<MetaMaskInpageProvider | null>;
/**
 * Get a provider that supports snaps. This will loop through all the detected
 * providers and return the first one that supports snaps.
 *
 * @returns The provider, or `null` if no provider supports snaps.
 */
export declare function getSnapsProvider(): Promise<MetaMaskInpageProvider | null>;
