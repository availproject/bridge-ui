import { useCallback, useEffect, useMemo, useState } from "react"
import BigNumber from 'bignumber.js'
import { useWriteContract } from "wagmi";
import { readContract } from "@wagmi/core";


import ethereumAvailTokenAbi from "@/constants/abis/ethereumAvailToken.json";
import ethereumBridge from "@/constants/abis/ethereumBridge.json";

import { TRANSACTION_TYPES } from "@/@types/transaction";
import useEthWallet from "@/hooks/useEthWallet";
import { appConfig } from "@/config/default";
import { ethConfig } from "@/config";

import { substrateAddressToPublicKey } from "@/utils/addressFormatting";
import { useAvailAccount } from "@/store/availWalletHook";

export default function useBridge() {
  const { switchNetwork, activeNetworkId, activeUserAddress } = useEthWallet();
  const {
    data: hash,
    isPending,
    writeContractAsync
  } = useWriteContract()
  const { selected } = useAvailAccount();


  const networks = appConfig.networks;

  /**
   * @description Validates chain according to transaction type, and changes chain if needed
   * @param txType Transaction type
   */
  const validateChain = useCallback(
    async (txType: TRANSACTION_TYPES) => {
      if (txType === TRANSACTION_TYPES.BRIDGE_AVAIL_TO_ETH) {
        if (networks.avail.networkId !== await activeNetworkId()) {
          await switchNetwork(networks.avail.networkId);
        }
      } else if (txType === TRANSACTION_TYPES.BRIDGE_ETH_TO_AVAIL) {
        if (networks.ethereum.networkId !== await activeNetworkId()) {
          await switchNetwork(networks.ethereum.networkId);
        }
      }
    },
    [],
  );

  const getAvailBalanceOnEth = useCallback(async () => {
    // Get AVAIL balance on Ethereum chain
    const balance = await readContract(ethConfig, {
      address: appConfig.contracts.ethereum.availToken as `0x${string}`,
      abi: ethereumAvailTokenAbi,
      functionName: "balanceOf",
      args: [activeUserAddress],
      chainId: networks.ethereum.networkId,
    });

    if (!balance) return new BigNumber(0);

    return new BigNumber(balance);
  }
    , [activeUserAddress, networks.ethereum.networkId]);


  const getCurrentAllowanceOnEth = useCallback(async () => {
    try {
      // Get current allowance on Ethereum chain
      const allowance = await readContract(ethConfig, {
        address: appConfig.contracts.ethereum.availToken as `0x${string}`,
        abi: ethereumAvailTokenAbi,
        functionName: "allowance",
        args: [activeUserAddress, appConfig.contracts.ethereum.bridge],
        chainId: networks.ethereum.networkId,
      });

      if (!allowance) return new BigNumber(0);

      return new BigNumber(allowance);
    } catch (error) {
      throw new Error("error fetching allowance");
    }
  }, [activeUserAddress, networks.ethereum.networkId]);

  const approveOnEth = useCallback(async (atomicAmount: string) => {
    // approve on ethereum chain
    const txHash = await writeContractAsync({
      address: appConfig.contracts.ethereum.availToken as `0x${string}`,
      abi: ethereumAvailTokenAbi,
      functionName: "approve",
      // args: [spender, amount]
      args: [appConfig.contracts.ethereum.bridge, atomicAmount],
      chainId: networks.ethereum.networkId,
    });

    txHash && console.log(txHash);
  }
    , []);



  const burnAvailOnEth = useCallback(async ({
    atomicAmount,
    destinationAddress
  }: { atomicAmount: string, destinationAddress: string }) => {

    const byte32DestinationAddress = substrateAddressToPublicKey(destinationAddress);

    const txHash = await writeContractAsync({
      address: appConfig.contracts.ethereum.bridge as `0x${string}`,
      abi: ethereumBridge,
      functionName: "sendAVAIL",
      // args: [recipient, amount]
      args: [byte32DestinationAddress, atomicAmount],
      chainId: networks.ethereum.networkId,
    });

    txHash && console.log(txHash);
  }
    , []);

  const initEthToAvailBridging = useCallback(async ({
    atomicAmount,
    destinationAddress
  }: { atomicAmount: string, destinationAddress: string }) => {
    // validate chain
    await validateChain(TRANSACTION_TYPES.BRIDGE_ETH_TO_AVAIL);

    if (await activeNetworkId() !== networks.ethereum.networkId) {
      throw new Error(`Invalid network, please switch to ${networks.ethereum.name} network(id: ${networks.ethereum.networkId})`);
    }

    // check approval
    const currentAllowance = await getCurrentAllowanceOnEth()
    if (new BigNumber(atomicAmount).gt(currentAllowance)) {
      // approve
      await approveOnEth(atomicAmount);
    }

    const availBalance = await getAvailBalanceOnEth();
    if (new BigNumber(atomicAmount).gt(new BigNumber(availBalance))) {
      // handle insufficient balance
      throw new Error("insufficient balance")
    }

    const burnTxHash = await burnAvailOnEth({ atomicAmount, destinationAddress });

    // todo:
    // initiate bridging
    // create contract instance for appConfig.contracts.ethereum.bridge
    // call contract method
  }
    , []);

  return { initEthToAvailBridging };
}
