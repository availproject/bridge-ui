/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect } from "react";
import BigNumber from "bignumber.js";
import { useWriteContract } from "wagmi";
import { readContract } from "@wagmi/core";

import ethereumAvailTokenAbi from "@/constants/abis/ethereumAvailToken.json";
import ethereumBridge from "@/constants/abis/ethereumBridge.json";

import { ethConfig } from "@/config/walletConfig";
import { Transaction, TRANSACTION_TYPES } from "@/types/transaction";
import { Chain, TransactionStatus } from "@/types/common";
import { appConfig } from "@/config/default";

import useEthWallet from "@/hooks/useEthWallet";
import useTransactions from "@/hooks/useTransactions";
import { useAvailAccount } from "@/stores/availWalletHook";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { substrateAddressToPublicKey } from "@/utils/addressFormatting";
import {
  fetchAvlHead,
  fetchEthHead,
  fetchLatestBlockhash,
} from "@/services/api";
import { sendMessage } from "@/services/vectorpallet";
import { _getBalance, showSuccessMessage } from "@/utils/common";
import { Logger } from "@/utils/logger";
import { ONE_POWER_EIGHTEEN } from "@/constants/bigNumber";

export default function useBridge() {
  const { switchNetwork, activeNetworkId, activeUserAddress } = useEthWallet();
  const { addToLocalTransaction } = useTransactions();
  const { data: hash, isPending, writeContractAsync } = useWriteContract();
  const { selected } = useAvailAccount();
  const { setAvlHead, setEthHead, setLatestBlockhash } = useLatestBlockInfo();

  const networks = appConfig.networks;

  /**
   * @description Validates chain according to transaction type, and changes chain if needed
   * @param txType Transaction type
   */
  const validateChain = async (txType: TRANSACTION_TYPES) => {
    if (txType === TRANSACTION_TYPES.BRIDGE_AVAIL_TO_ETH) {
      // if (networks.avail.networkId !== await activeNetworkId()) {
      //   await switchNetwork(networks.avail.networkId);
      // }
    } else if (txType === TRANSACTION_TYPES.BRIDGE_ETH_TO_AVAIL) {
      if (networks.ethereum.id !== (await activeNetworkId())) {
        await switchNetwork(networks.ethereum.id);
      }
    }
  };

  useEffect(() => {
    setInterval(async () => {
      const ethHead = await fetchEthHead();
      const LatestBlockhash = await fetchLatestBlockhash(ethHead.data.slot);
      setLatestBlockhash(LatestBlockhash.data);
      const avlHead = await fetchAvlHead();
      setEthHead(ethHead.data);
      setAvlHead(avlHead.data);
    }, 50000);
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

      return txHash;
    },
    []
  );

  /**
   * @description Initiates bridging from Ethereum to AVAIL,
   * @steps Validates chain, Checks approval, Checks balance, Initiates bridging(sendAvail() on Eth)
   */
  const initEthToAvailBridging = async ({
    atomicAmount,
    destinationAddress,
  }: {
    atomicAmount: string;
    destinationAddress: string;
  }) => {
    if (!activeUserAddress) {
      throw new Error("No account selected");
    }

    await validateChain(TRANSACTION_TYPES.BRIDGE_ETH_TO_AVAIL);

    if ((await activeNetworkId()) !== networks.ethereum.id) {
      throw new Error(
        `Invalid network, please switch to ${networks.ethereum.name} network(id: ${networks.ethereum.id})`
      );
    }

    // check approval
    const currentAllowance = await getCurrentAllowanceOnEth();
    if (new BigNumber(atomicAmount).gt(currentAllowance)) {
      await approveOnEth(atomicAmount);
      showSuccessMessage({
        title: "Approval Executed",
        desc: "Your approval transaction has been successfully executed",
      });
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

    addToLocalTransaction({
      sourceChain: Chain.ETH,
      destinationChain: Chain.AVAIL,
      sourceTransactionHash: burnTxHash,
      destinationTransactionHash: destinationAddress,
      amount: atomicAmount,
      status: TransactionStatus.INITIATED,
      messageId: 0,
      dataType: "ERC20",
      depositorAddress: activeUserAddress,
      receiverAddress: destinationAddress,
      sourceBlockHash: "0x",
      sourceTransactionBlockNumber: 0,
      sourceTransactionIndex: 0,
      sourceTimestamp: new Date().toISOString(),
    });

    Logger.debug(`Burn transaction hash: ${burnTxHash}`);

    return burnTxHash;
  };

  const initAvailToEthBridging = async ({
    atomicAmount,
    destinationAddress,
  }: {
    atomicAmount: string;
    destinationAddress: `${string}`;
  }) => {
    if (selected === undefined || selected === null) {
      throw new Error("No account selected");
    }
    const availBalance = await _getBalance(Chain.AVAIL, selected?.address);
    // if (!availBalance) {
    // note: product decision here was to allow the user
    // to go ahead with tx when we are unable to fetch the balance
    // }

    if (
      availBalance &&
      new BigNumber(atomicAmount).gt(
        new BigNumber(availBalance).times(ONE_POWER_EIGHTEEN)
      )
    ) {
      throw new Error("insufficient balance");
    }

    const send = await sendMessage(
      {
        message: {
          FungibleToken: {
            assetId:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            amount: atomicAmount as unknown as BigInt,
          },
        },
        to: `${destinationAddress.padEnd(66, "0")}`,
        domain: 2,
      },
      selected!
    );
    if (send.blockhash !== undefined && send.txHash !== undefined) {
      const tempLocalTransaction: Transaction = {
        status: TransactionStatus.INITIATED,
        destinationChain: Chain.ETH,
        messageId: 0,
        sourceChain: Chain.AVAIL,
        amount: atomicAmount,
        dataType: "ERC20",
        depositorAddress: selected?.address,
        receiverAddress: "",
        sourceBlockHash: send.blockhash,
        sourceTransactionBlockNumber: 0,
        sourceTransactionHash: send.txHash,
        sourceTransactionIndex: 0,
        sourceTimestamp: new Date().toISOString(),
      };

      await addToLocalTransaction(tempLocalTransaction);
    }

    return send;
  };

  return { initEthToAvailBridging, initAvailToEthBridging };
}
