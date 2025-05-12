import { MetaMaskContext, MetaMaskProvider, useMetaMaskContext } from './MetamaskContext';

// Re-export types
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

export type Request = (params: { method: string; params?: any }) => Promise<unknown | null>;

// Default snap origin
export const defaultSnapOrigin = process.env.SNAP_ORIGIN ?? `npm:@avail-project/avail-snap`;

// Export context components
export { MetaMaskContext, MetaMaskProvider, useMetaMaskContext };

// Define hooks here instead of importing

export function useRequest(): Request {
  const context = useMetaMaskContext();
  
  return async ({ method, params }) => {
    try {
      const data = await context.provider?.request({
        method,
        params,
      }) ?? null;

      return data;
    } catch (error) {
      context.setError(error as Error);
      return null;
    }
  };
}

export function useMetaMask() {
  const { provider, setInstalledSnap, installedSnap } = useMetaMaskContext();
  const request = useRequest();
  const [isFlask, setIsFlask] = useState(false);
  const [metamaskInstalled, setMetamaskInstalled] = useState(false);

  useEffect(() => {
    const detectMetaMask = () => {
      if (typeof window === 'undefined') {
        return;
      }
      
      const { ethereum } = window as any;
      const isMetaMaskInstalled = Boolean(ethereum && ethereum.isMetaMask);
      setMetamaskInstalled(isMetaMaskInstalled);
    };

    detectMetaMask();
  }, []);

  const snapsDetected = provider !== null;

  const detectFlask = async () => {
    const clientVersion = await request({
      method: 'web3_clientVersion',
    });

    const isFlaskDetected = (clientVersion as string[])?.includes('flask');
    setIsFlask(isFlaskDetected);
  };

  const detectMetaMask = () => {
    const { ethereum } = window as any;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

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
  }, [provider]);

  return { isFlask, snapsDetected, installedSnap, getSnap, detectMetaMask, metamaskInstalled };
}

export function useInvokeSnap(snapId = defaultSnapOrigin) {
  const request = useRequest();

  const invokeSnap = async ({ method, params }: InvokeSnapParams) =>
    request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: params ? { method, params } : { method },
      },
    });

  return invokeSnap;
}

export function useRequestSnap(
  snapId = defaultSnapOrigin,
  version?: string,
) {
  const request = useRequest();
  const { setInstalledSnap } = useMetaMaskContext();

  const requestSnap = async () => {
    const snaps = (await request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: version ? { version } : {},
      },
    })) as Record<string, Snap>;

    setInstalledSnap(snaps?.[snapId] ?? null);
  };

  return requestSnap;
}

// Import React for useState and useEffect
import { useState, useEffect } from 'react';