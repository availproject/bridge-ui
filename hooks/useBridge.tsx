import { useCallback, useEffect, useState } from "react"
import BigNumber from 'bignumber.js'

import { TRANSACTION_TYPES } from "@/@types/transaction";
import useEthWallet from "@/hooks/useEthWallet";
import { appConfig } from "@/config/default";

export default function useBridge() {
  const { switchNetwork, activeNetworkId } = useEthWallet();
  const networks = appConfig.networks;

  /**
   * @description Validates chain according to transaction type, and changes chain if needed
   * @param txType Transaction type
   */
  const validateChain = useCallback(
    async (txType: TRANSACTION_TYPES) => {
      if (txType === TRANSACTION_TYPES.BRIDGE_AVAIL_TO_ETH) {

        if (networks.avail.networkId !== activeNetworkId) {
          await switchNetwork(networks.avail.networkId);
        }
        return networks.avail.networkId === activeNetworkId;
      } else if (txType === TRANSACTION_TYPES.BRIDGE_ETH_TO_AVAIL) {
        if (networks.ethereum.networkId !== activeNetworkId) {
          await switchNetwork(networks.ethereum.networkId);
        }
        return networks.ethereum.networkId === activeNetworkId;
      }
    },
    [],
  );

  const initEthToAvailBridging = useCallback(async ({
    atomicAmount,
  }: { atomicAmount: BigNumber }) => {

    // validate chain
    const switchChainSuccess = await validateChain(TRANSACTION_TYPES.BRIDGE_ETH_TO_AVAIL);
    if (!switchChainSuccess) {
      throw new Error("Error switching chain");
    }

    // check approval
    const currentAllowance = await getCurrentAllowanceOnEth()
    if (new BigNumber(atomicAmount).gt(currentAllowance)) {
      // approve
      await approveOnEth();
    }

    // initiate bridging
    // create contract instance for appConfig.contracts.ethereum.bridge
    // call contract method
  }
    , []);

  const getCurrentAllowanceOnEth = useCallback(async () => {
    // get current allowance on ethereum chain
    return new BigNumber(1000000);
  }
    , []);

  const approveOnEth = useCallback(async () => {
    // approve on ethereum chain
  }
    , []);


  return { validateChain };
}
