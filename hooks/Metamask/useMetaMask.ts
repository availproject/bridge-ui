import { useEffect, useState } from 'react';

import { useMetaMaskContext } from './MetamaskContext';
import { useRequest } from './useRequest';
import { GetSnapsResponse } from './types';
import { defaultSnapOrigin } from '.';

/**
 * A Hook to retrieve useful data from MetaMask.
 * @returns The informations.
 */
export const useMetaMask = () => {
  const { provider, setInstalledSnap, installedSnap } = useMetaMaskContext();
  const request = useRequest();

  const [isFlask, setIsFlask] = useState(false);

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
  
  try {
    const isMetaMaskInstalled = detectMetaMask();
    if (!isMetaMaskInstalled) {
      console.log('Please install MetaMask!');
    }
  } catch (error) {
    console.error('Error during MetaMask detection:', error);
  }

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

  return { isFlask, snapsDetected, installedSnap, getSnap, detectMetaMask };
};
