/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect } from "react";
import BigNumber from "bignumber.js";
import { useWriteContract } from "wagmi";
import { getBalance, readContract } from "@wagmi/core";
import ethereumAvailTokenAbi from "@/constants/abis/ethereumAvailToken.json";
import ethereumBridge from "@/constants/abis/ethereumBridge.json";
import { TRANSACTION_TYPES } from "@/types/transaction";
import useEthWallet from "@/hooks/useEthWallet";
import { appConfig } from "@/config/default";
import { ethConfig } from "@/config/walletConfig";
import { substrateAddressToPublicKey } from "@/utils/addressFormatting";
import { useAvailAccount } from "@/stores/availWalletHook";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { fetchAvlHead, fetchEthHead } from "@/services/api";
import { Chain } from "@/types/common";
import { _getBalance } from "@/utils/common";
import { sendMessage } from "@/services/vectorpallete";

export default function useBridge() {
  const { switchNetwork, activeNetworkId, activeUserAddress } = useEthWallet();
  const { data: hash, isPending, writeContractAsync } = useWriteContract();
  const { selected } = useAvailAccount();
  const { avlHead, ethHead, setAvlHead, setEthHead } = useLatestBlockInfo();
  const networks = appConfig.networks;

  /**
   * @description Validates chain according to transaction type, and changes chain if needed
   * @param txType Transaction type
   */
  const validateChain = useCallback(async (txType: TRANSACTION_TYPES) => {
    if (txType === TRANSACTION_TYPES.BRIDGE_AVAIL_TO_ETH) {
      // if (networks.avail.networkId !== await activeNetworkId()) {
      //   await switchNetwork(networks.avail.networkId);
      // }
    } else if (txType === TRANSACTION_TYPES.BRIDGE_ETH_TO_AVAIL) {
      if (networks.ethereum.id !== (await activeNetworkId())) {
        await switchNetwork(networks.ethereum.id);
      }
    }
  }, []);

  useEffect(() => {
    setInterval(async () => {
      const ethHead = await fetchEthHead();
      const avlHead = await fetchAvlHead();
      setEthHead(ethHead.data);
      setAvlHead(avlHead.data);
    }, 500000);
  }, []);

  const getAvailBalanceOnEth = useCallback(async () => {
    // Get AVAIL balance on Ethereum chain
    const balance = await readContract(ethConfig, {
      address: appConfig.contracts.ethereum.availToken as `0x${string}`,
      abi: ethereumAvailTokenAbi,
      functionName: "balanceOf",
      args: [activeUserAddress],
      chainId: networks.ethereum.id,
    });

    if (!balance) return new BigNumber(0);

    //@ts-ignore TODO: P2
    return new BigNumber(balance);
  }, [activeUserAddress, networks.ethereum.id]);

  const getCurrentAllowanceOnEth = useCallback(async () => {
    try {
      // Get current allowance on Ethereum chain
      const allowance = await readContract(ethConfig, {
        address: appConfig.contracts.ethereum.availToken as `0x${string}`,
        abi: ethereumAvailTokenAbi,
        functionName: "allowance",
        args: [activeUserAddress, appConfig.contracts.ethereum.bridge],
        chainId: networks.ethereum.id,
      });

      if (!allowance) return new BigNumber(0);
      //@ts-ignore TODO: P2
      return new BigNumber(allowance);
    } catch (error) {
      throw new Error("error fetching allowance");
    }
  }, [activeUserAddress, networks.ethereum.id]);

  const approveOnEth = useCallback(async (atomicAmount: string) => {
    // approve on ethereum chain
    const txHash = await writeContractAsync({
      address: appConfig.contracts.ethereum.availToken as `0x${string}`,
      abi: ethereumAvailTokenAbi,
      functionName: "approve",
      // args: [spender, amount]
      args: [appConfig.contracts.ethereum.bridge, atomicAmount],
      chainId: networks.ethereum.id,
    });

    txHash && console.log(txHash);
  }, []);

  const burnAvailOnEth = useCallback(
    async ({
      atomicAmount,
      destinationAddress,
    }: {
      atomicAmount: string;
      destinationAddress: string;
    }) => {
      const byte32DestinationAddress =
        substrateAddressToPublicKey(destinationAddress);

      const txHash = await writeContractAsync({
        address: appConfig.contracts.ethereum.bridge as `0x${string}`,
        abi: ethereumBridge,
        functionName: "sendAVAIL",
        // args: [recipient, amount]
        args: [byte32DestinationAddress, atomicAmount],
        chainId: networks.ethereum.id,
      });

      txHash && console.log(txHash);
    },
    []
  );

  const initEthToAvailBridging = useCallback(
    async ({
      atomicAmount,
      destinationAddress,
    }: {
      atomicAmount: string;
      destinationAddress: string;
    }) => {
      await validateChain(TRANSACTION_TYPES.BRIDGE_ETH_TO_AVAIL);

      if ((await activeNetworkId()) !== networks.ethereum.id) {
        throw new Error(
          `Invalid network, please switch to ${networks.ethereum.name} network(id: ${networks.ethereum.id})`
        );
      }

      // check approval
      const currentAllowance = await getCurrentAllowanceOnEth();
      if (new BigNumber(atomicAmount).gt(currentAllowance)) {
        // approve
        await approveOnEth(atomicAmount);
      }

      const availBalance = await getAvailBalanceOnEth();
      if (new BigNumber(atomicAmount).gt(new BigNumber(availBalance))) {
        // handle insufficient balance
        throw new Error("insufficient balance");
      }

      const burnTxHash = await burnAvailOnEth({
        atomicAmount,
        destinationAddress,
      });

      // todo:
      // initiate bridging
      // create contract instance for appConfig.contracts.ethereum.bridge
      // call contract method
    },
    []
  );

  const initAvailToEthBridging = useCallback(
    async ({
      atomicAmount,
      destinationAddress,
    }: {
      atomicAmount: string;
      destinationAddress: `${string}`;
    }) => {
      if(selected === undefined) {
        throw new Error("No account selected");
      }

      const availBalance = await _getBalance(Chain.AVAIL, selected?.address);
      console.log(availBalance, "availBalance");
      if (new BigNumber(atomicAmount).gt(new BigNumber(availBalance * 10**18))) {
        console.log(new BigNumber(atomicAmount).toNumber() ,new BigNumber(availBalance * 10**18).toNumber() , "yeh kaise")
        throw new Error("insufficient balance");
      }
      await sendMessage(
        {
          message: {
            FungibleToken: {
              assetId:
                "0x0000000000000000000000000000000000000000000000000000000000000000",
              amount: BigInt(atomicAmount),
            },
          },
          to: `${destinationAddress.padEnd(66, "0")}`,
          domain: 2,
        },
        selected!
      );
      
    },[]
  );

  return { initEthToAvailBridging, initAvailToEthBridging };
}
