/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect } from "react";
import BigNumber from "bignumber.js";
import { useWriteContract } from "wagmi";
import { readContract } from "@wagmi/core";

import ethereumAvailTokenTuring from "@/constants/abis/ethereumAvailTokenTuring.json";
import ethereumBridgeTuring from "@/constants/abis/ethereumBridgeTuring.json";
import ethereumAvailTokenMainnet from "@/constants/abis/ethereumAvailTokenMainnet.json";
import ethereumBridgeMainnet from "@/constants/abis/ethereumBridgeMainnet.json";

import { ethConfig } from "@/config/walletConfig";
import { Transaction, TRANSACTION_TYPES } from "@/types/transaction";
import { Chain, TransactionStatus } from "@/types/common";
import { appConfig } from "@/config/default";

import useEthWallet from "@/hooks/useEthWallet";
import useTransactions from "@/hooks/useTransactions";
import { useAvailAccount } from "@/stores/availWalletHook";
import { substrateAddressToPublicKey } from "@/utils/addressFormatting";
import { sendMessage } from "@/services/vectorpallet";
import { _getBalance, initApi, showSuccessMessage, sleep } from "@/utils/common";
import { Logger } from "@/utils/logger";
import { ONE_POWER_EIGHTEEN } from "@/constants/bigNumber";
import { useCommonStore } from "@/stores/common";
import { ApiPromise } from "avail-js-sdk";

export default function useBridge() {
  const { switchNetwork, activeNetworkId, activeUserAddress } = useEthWallet();
  const { addToLocalTransaction } = useTransactions();
  const { data: hash, isPending, writeContractAsync } = useWriteContract();
  const { selected } = useAvailAccount();
  const { api, setApi } = useCommonStore();

  const networks = appConfig.networks;

  const validateChain = async (txType: TRANSACTION_TYPES) => {
     if (txType === TRANSACTION_TYPES.BRIDGE_ETH_TO_AVAIL) {
      if (networks.ethereum.id !== (await activeNetworkId())) {
        await switchNetwork(networks.ethereum.id);
      }
    }
  };

  const getAvailBalanceOnEth = useCallback(async () => {
    // Get AVAIL balance on Ethereum chain
    const balance = await readContract(ethConfig, {
      address: appConfig.contracts.ethereum.availToken as `0x${string}`,
      abi: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK === "mainnet" ? ethereumAvailTokenMainnet : ethereumAvailTokenTuring,
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
        abi: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK === "mainnet" ? ethereumAvailTokenMainnet : ethereumAvailTokenTuring,
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
      abi: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK === "mainnet" ? ethereumAvailTokenMainnet : ethereumAvailTokenTuring,
      functionName: "approve",
      // args: [spender, amount]
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

      const txHash = await writeContractAsync({
        address: appConfig.contracts.ethereum.bridge as `0x${string}`,
        abi: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK === "mainnet" ? ethereumBridgeMainnet : ethereumBridgeTuring,
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
      sourceBlockNumber: 0,
      sourceTransactionIndex: 0,
      sourceTimestamp: new Date().toISOString(),
    });

    Logger.debug(`Burn transaction hash: ${burnTxHash}`);

    return burnTxHash;
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
    if (selected === undefined || selected === null) {
      throw new Error("No account selected");
    }

    let retriedApiConn: ApiPromise | null = null;

    if(!api || api.isConnected) {
      Logger.debug("Retrying API Conn");
      retriedApiConn = await initApi();
      setApi(retriedApiConn);
      if (!retriedApiConn) {
        throw new Error("Uh Oh! RPC under a lot of stress, error intialising api");}
    }

    const availBalance = await _getBalance(Chain.AVAIL, api ? api : retriedApiConn!,  selected?.address);

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
      selected!,
      api ? api : retriedApiConn!
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
        sourceBlockNumber: 0,
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
