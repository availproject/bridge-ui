/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect } from "react";
import BigNumber from "bignumber.js";
import { useAccount, useWriteContract } from "wagmi";
import { estimateGas, readContract } from "@wagmi/core";

import { Transaction } from "@/types/transaction";
import { Chain, TransactionStatus } from "@/types/common";
import { appConfig } from "@/config/default";

import useEthWallet from "@/hooks/common/useEthWallet";
import useTransactions from "@/hooks/useTransactions";
import { useAvailAccount } from "@/stores/availwallet";
import { sendMessage } from "@/services/pallet";
import { substrateAddressToPublicKey } from "@/utils/common";
import { Logger } from "@/utils/logger";
import { ONE_POWER_EIGHTEEN } from "@/constants/bigNumber";
import { showSuccessMessage } from "@/utils/toasts";
import { encodeFunctionData, formatUnits } from "viem";
import { useInvokeSnap } from "./metamask";
import { checkTransactionStatus } from "./metamask/utils";

import bridgeImplAbi from "@/constants/abis/bridgeImplAbi.json";
import availTokenAbi from "@/constants/abis/availTokenAbi.json";

import type {
  Transaction as MetamaskTransaction,
  TxPayload,
} from "@avail-project/metamask-avail-types";
import { config } from "@/config/walletConfig";
import { useApi } from "@/stores/api";
import { getTokenBalance } from "@/services/contract";

export default function useZkBridge() {
  const { activeUserAddress, validateandSwitchChain } = useEthWallet();
  const { addToLocalTransaction } = useTransactions();
  const { writeContractAsync } = useWriteContract();
  const { selected } = useAvailAccount();
  const { address } = useAccount();
  const {api, ensureConnection} = useApi();
  const invokeSnap = useInvokeSnap();
  const networks = appConfig.networks;

  /** HELPER FUNCTIONS */
  const getAvailBalanceOnEth = useCallback(async () => {
    const balance = await readContract(config, {
      address: appConfig.contracts.ethereum.availToken as `0x${string}`,
      abi: availTokenAbi,
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
      const allowance = await readContract(config, {
        address: appConfig.contracts.ethereum.availToken as `0x${string}`,
        abi: availTokenAbi,
        functionName: "allowance",
        args: [activeUserAddress, appConfig.contracts.ethereum.bridge],
        chainId: networks.ethereum.id,
      });

      if (!allowance) return new BigNumber(0);

      return new BigNumber(allowance.toString());
    } catch (error) {
      throw new Error("error fetching allowance");
    }
  }, [activeUserAddress, networks.ethereum.id]);

  const approveOnEth = useCallback(async (atomicAmount: string) => {
    const txHash = await writeContractAsync({
      address: appConfig.contracts.ethereum.availToken as `0x${string}`,
      abi: availTokenAbi,
      functionName: "approve",
      args: [appConfig.contracts.ethereum.bridge, atomicAmount],
      chainId: networks.ethereum.id,
    });

    txHash && Logger.info(`This is tx hash: ${txHash}`);
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

        const estimatedGas = await estimateGas(config, {
          to: appConfig.contracts.ethereum.bridge as `0x${string}`,
          data: encodeFunctionData({
            abi: bridgeImplAbi,
            functionName: "sendAVAIL",
            args: [byte32DestinationAddress, atomicAmount],
          })
        })

      const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100);
      
      const txHash = await writeContractAsync({
        address: appConfig.contracts.ethereum.bridge as `0x${string}`,
        abi: bridgeImplAbi,
        functionName: "sendAVAIL",
        // args: [recipient, amount]
        args: [byte32DestinationAddress, atomicAmount],
        chainId: networks.ethereum.id,
        gas: gasWithBuffer,
      });

      return txHash;
    },
    []
  );

  const snapSendMessage = async ({
    atomicAmount,
    destinationAddress,
  }: {
    atomicAmount: string;
    destinationAddress: string;
  }) => {
    const txPayload = await invokeSnap({
      method: "generateTransactionPayload",
      params: {
        module: "vector",
        method: "sendMessage",
        args: [
          {
            FungibleToken: {
              assetId:
                appConfig.assetId,
              amount: atomicAmount,
            },
          },
          `${destinationAddress.padEnd(66, "0")}`,
          2,
        ],
      },
    });

    const signedTx = await invokeSnap({
      method: "signPayloadJSON",
      params: {
        payload: (txPayload as TxPayload).payload,
      },
    });

    const txHash = await invokeSnap({
      method: "send",
      params: {
        signature: (signedTx as { signature: string }).signature,
        txPayload: txPayload,
        network: 1,
      },
    });

    return (txHash as MetamaskTransaction).hash;
  };

  /** BRIDGING FLOWS */

  /**
   * @desc Initiates bridging from Ethereum to AVAIL,
   */
  const initEthToAvailBridging = async ({
    atomicAmount,
    destinationAddress,
  }: {
    atomicAmount: string;
    destinationAddress: string;
  }) => {
    try {
      if (!activeUserAddress) 
        throw new Error("No account selected");

      await validateandSwitchChain(Chain.ETH);

      const currentAllowance = await getCurrentAllowanceOnEth();
      if (new BigNumber(atomicAmount).gt(currentAllowance)) {
        await approveOnEth(atomicAmount);
        showSuccessMessage({
          title: "Approval Executed",
          desc: "Your approval transaction has been successfully executed",
        });
      }

      const availBalance = await getAvailBalanceOnEth();
      if (new BigNumber(atomicAmount).gte(new BigNumber(availBalance))) {
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
        amount: atomicAmount,
        status: TransactionStatus.INITIATED,
        depositorAddress: activeUserAddress,
        receiverAddress: destinationAddress,
        sourceTimestamp: new Date().toISOString(),
      });

      Logger.info(
        `ETH_TO_AVAIL_INIT_SUCCESS ${burnTxHash} receiver_address: ${destinationAddress} sender_address: ${address} amount: ${atomicAmount}`
      );

      return burnTxHash;
    } catch (error: any) {
      Logger.error(
        `ETH_TO_AVAIL_INIT_FAILED: ${error}`,
        ["receiver_address", destinationAddress],
        ["sender_address", address],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", "ETH -> AVAIL"]
      );
      throw new Error(`ETH_TO_AVAIL_INIT_FAILED: ${error} `);
    }
  };

  /**
   * @description Initiates bridging from AVAIL to Ethereum,
   * @steps Validates chain, Checks approval, Checks balance, Initiates bridging(sendAvail() on Eth)
   */
  const initAvailToEthBridging = async ({
    atomicAmount,
    destinationAddress,
  }: {
    atomicAmount: string;
    destinationAddress: `${string}`;
  }) => {
    try {
      if (selected === undefined || selected === null) {
        throw new Error("No account selected");
      }

     if (!api || !api.isConnected || !api.isReady) await ensureConnection();
    if (!api?.isReady)
        throw new Error("Uh oh! Failed to connect to Avail Api");

    const availBalance = await getTokenBalance(Chain.AVAIL, selected.address, api);
      if (!availBalance) {
        throw new Error("Failed to fetch balance");
      }

      if (
        availBalance &&
        new BigNumber(atomicAmount).gt(
          new BigNumber(availBalance).times(ONE_POWER_EIGHTEEN)
        )
      ) {
        throw new Error("insufficient avail balance");
      }

      if (selected.source === "MetamaskSnap") {
        const send = await snapSendMessage({
          atomicAmount,
          destinationAddress,
        });
        const result = await checkTransactionStatus(
          api!,
          send
        );

        if (result.isOk()) {
          const success = {
            status: "success",
            message: "Transaction successful",
            txHash: send as string,
            blockhash: result.value.blockhash,
          };

          const tempLocalTransaction: Transaction = {
            status: TransactionStatus.INITIATED,
            destinationChain: Chain.ETH,
            messageId: 0,
            sourceChain: Chain.AVAIL,
            amount: atomicAmount,
            dataType: "ERC20",
            depositorAddress: selected?.address,
            receiverAddress: destinationAddress,
            sourceBlockHash: success.blockhash,
            sourceBlockNumber: 0,
            sourceTransactionHash: success.txHash as `0x${string}`,
            sourceTransactionIndex: 0,
            sourceTimestamp: new Date().toISOString(),
          };

          await addToLocalTransaction(tempLocalTransaction);
          Logger.info(
            `AVAIL_TO_ETH_INIT_SUCCESS ${send} receiver_address: ${destinationAddress} sender_address: ${selected?.address} amount: ${atomicAmount}`
          );
          return success;
        } else {
          throw new Error(
            `Metamask Snap Transaction failed with error: ${result.error}`
          );
        }
      }

      const send = await sendMessage(
        {
          message: {
            FungibleToken: {
              assetId:
                appConfig.assetId,
              amount: BigInt(atomicAmount),
            },
          },
          to: `${destinationAddress.padEnd(66, "0")}`,
          domain: 2,
        },
        selected!,
        api
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
          receiverAddress: destinationAddress,
          sourceBlockHash: send.blockhash,
          sourceTransactionHash: send.txHash as `0x${string}`,
          sourceTransactionIndex: 0,
          sourceTimestamp: new Date().toISOString(),
        };

        await addToLocalTransaction(tempLocalTransaction);
        Logger.info(
          `AVAIL_TO_ETH_INIT_SUCCESS ${send.txHash} receiver_address: ${destinationAddress} sender_address: ${selected?.address} amount: ${atomicAmount}`
        );
      }

      return send;
    } catch (error: any) {
      Logger.error(
        `AVAIL_TO_ETH_INIT_FAILED: ${error}`,
        ["receiver_address", destinationAddress],
        ["sender_address", selected?.address],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", "AVAIL -> ETH"]
      );
      throw error;
    }
  };

  return { initEthToAvailBridging, initAvailToEthBridging };
}
