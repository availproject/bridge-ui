// Explicitly retype MetaMaskInpageProvider to avoid import issues
import type { MetaMaskInpageProvider } from "@metamask/providers";

// Add ethereum to Window interface
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
export const hasSnapsSupport = async (
  provider: MetaMaskInpageProvider = window.ethereum as MetaMaskInpageProvider
) => {
  try {
    await provider.request({
      method: "wallet_getSnaps",
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Get a provider that supports snaps.
 */
export const getSnapsProvider = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (
    window.ethereum &&
    (await hasSnapsSupport(window.ethereum as MetaMaskInpageProvider))
  ) {
    return window.ethereum as MetaMaskInpageProvider;
  }

  if (window.ethereum?.detected) {
    for (const provider of window.ethereum.detected) {
      if (await hasSnapsSupport(provider)) {
        return provider;
      }
    }
  }

  if (window.ethereum?.providers) {
    for (const provider of window.ethereum.providers) {
      if (await hasSnapsSupport(provider)) {
        return provider;
      }
    }
  }

  return null;
};

/**
 * Check if a snap ID is a local snap ID.
 */
export const isLocalSnap = (snapId: string) => snapId.startsWith("local:");

// Set a default snap origin
export const defaultSnapOrigin = `npm:@avail-project/avail-snap`;
