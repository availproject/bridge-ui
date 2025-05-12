import { useEffect, useState } from 'react';

import { useMetaMaskContext } from './MetamaskContext';
import { defaultSnapOrigin } from '.';

// Define the GetSnapsResponse type inline since we're having import issues
type GetSnapsResponse = Record<string, {
  permissionName: string;
  id: string;
  version: string;
  initialPermissions: Record<string, unknown>;
}>;

// Define the Request type inline
type Request = (params: { method: string; params?: any }) => Promise<unknown | null>;

// Create a minimal useRequest function
const useRequest = (): Request => {
  const { provider, setError } = useMetaMaskContext();
  
  return async ({ method, params }) => {
    try {
      const data = await provider?.request({
        method,
        params,
      }) ?? null;

      return data;
    } catch (error) {
      setError(error as Error);
      return null;
    }
  };
};

/**
 * A Hook to retrieve useful data from MetaMask.
 * @returns The informations.
 */
export const useMetaMask = () => {
  const { provider, setInstalledSnap, installedSnap } = useMetaMaskContext();
  const request = useRequest();

  const [isFlask, setIsFlask] = useState(false);
  const [metamaskInstalled, setMetamaskInstalled] = useState(false);

  useEffect(() => {
    const detectMetaMask = () => {
      if (typeof window === 'undefined') {
        return;
      }
      
      const { ethereum } = window;
      const isMetaMaskInstalled = Boolean(ethereum && ethereum.isMetaMask);
      setMetamaskInstalled(isMetaMaskInstalled);
    };

    detectMetaMask();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const snapsDetected = provider !== null;

  /**
   * Detect if the version of MetaMask is Flask.
   */
  const detectFlask = async () => {
    const clientVersion = await request({
      method: 'web3_clientVersion',
    });

    const isFlaskDetected = (clientVersion as string[])?.includes('flask');

    setIsFlask(isFlaskDetected);
  };

  /**
   * Detect if MetaMask is installed.
   */
  const detectMetaMask = () => {
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  /**
   * Get the Snap informations from MetaMask.
   */
  const getSnap = async () => {
    const snaps = (await request({
      method: 'wallet_getSnaps',
    })) as GetSnapsResponse;

    setInstalledSnap(snaps[defaultSnapOrigin] ?? null);
  };

  useEffect(() => {
    const detect = async () => {
      if (provider) {
        await detectMetaMask();
        await getSnap();
      }
    };

    detect().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  return { isFlask, snapsDetected, installedSnap, getSnap, detectMetaMask, metamaskInstalled };
};