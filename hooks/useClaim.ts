import { estimateGas, readContract, writeContract } from "@wagmi/core";
import { encodeAbiParameters, encodeFunctionData, formatUnits } from "viem";
import { executeParams, merkleProof } from "@/types/transaction";

import { getAccountStorageProofs, getMerkleProof } from "@/services/api";
import { executeTransaction } from "@/services/vectorpallet";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { useAvailAccount } from "@/stores/availWalletHook";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";
import { Chain, TransactionStatus } from "@/types/common";
import useTransactions from "./useTransactions";
import { useAccount } from "wagmi";
import { appConfig } from "@/config/default";
import useEthWallet from "./useEthWallet";
import { Logger } from "@/utils/logger";
import { useCommonStore } from "@/stores/common";
import { initApi } from "@/utils/common";
import { ApiPromise } from "avail-js-sdk";
import { useInvokeSnap } from "./Metamask/useInvokeSnap";
import { checkTransactionStatus } from "./Metamask/utils";
import {
  Transaction as MetamaskTransaction,
  TxPayload,
} from "@avail-project/metamask-avail-types";
import { config } from "@/config/walletConfig";
import useAppInit from "./useAppInit";

import bridgeImplAbi from "@/constants/abis/bridgeImplAbi.json";

export default function useClaim() {
  const { ethHead } = useLatestBlockInfo();
  const { switchNetwork, activeNetworkId } = useEthWallet();
  const { selected } = useAvailAccount();
  const { address } = useAccount();
  const { addToLocalTransaction } = useTransactions();
  const { api, setApi } = useCommonStore();
  const { refetchHeads } = useAppInit();

  const invokeSnap = useInvokeSnap();

  const networks = appConfig.networks;

  /**
   * @description Validates chain according to transaction type, and changes chain if needed
   * @param txType Transaction type
   */
  const validateChain = async () => {
    if (networks.ethereum.id !== (await activeNetworkId())) {
      await switchNetwork(networks.ethereum.id);
    }
  };

  /**
   * @description Receive/Claim after the merkleProof is fetched from the api AVAIL on ETH
   * @param merkleProof
   * @returns
   */
  async function receiveAvail(merkleProof: merkleProof) {
    try {
      const result = await writeContract(config, {
        address: appConfig.contracts.ethereum.bridge as `0x${string}`,
        abi: bridgeImplAbi,     
        functionName: "receiveAVAIL",
        args: [
          [
            "0x02",
            merkleProof.message.from,
            merkleProof.message.to,
            merkleProof.message.originDomain,
            merkleProof.message.destinationDomain,
            encodeAbiParameters(
              [
                {
                  name: "assetId",
                  type: "bytes32",
                },
                {
                  name: "amount",
                  type: "uint256",
                },
              ],
              [
                merkleProof.message.message.fungibleToken.asset_id,
                BigInt(merkleProof.message.message.fungibleToken.amount),
              ]
            ),
            merkleProof.message.id,
          ],
          [
            merkleProof.dataRootProof,
            merkleProof.leafProof,
            merkleProof.rangeHash,
            merkleProof.dataRootIndex,
            merkleProof.blobRoot,
            merkleProof.bridgeRoot,
            merkleProof.leaf,
            merkleProof.leafIndex,
          ],
        ],
      });
      return result;
    } catch (e: any) {
      throw new Error(`ERROR_RECIEVE_AVAIL ${e}`);
    }
  }

  const snapVectorExecute = async ({
    api,
    executeParams,
  }: {
    api: ApiPromise;
    executeParams: executeParams;
  }) => {
    try {
      const txPayload = await invokeSnap({
        method: "generateTransactionPayload",
        params: {
          module: "vector",
          method: "execute",
          args: [
            executeParams.slot,
            executeParams.addrMessage,
            executeParams.accountProof,
            executeParams.storageProof,
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

      const txnStatus = await checkTransactionStatus(
        api,
        (txHash as MetamaskTransaction).hash
      );

      return txnStatus.isOk()
        ? {
            blockHash: txnStatus.value.blockhash,
            txHash: (txHash as MetamaskTransaction).hash,
            status: "Success",
            message: "Transaction executed successfully",
          }
        : {
            status: "Failed",
            message: txnStatus.error.message,
          };
    } catch (e: any) {
      Logger.error(`ERROR_IN_SNAP_VECTOR_EXECUTE: ${e}`);
      throw e;
    }
  };

  const initClaimAvailToEth = async ({
    blockhash,
    sourceTransactionHash,
    sourceTransactionIndex,
    sourceTimestamp,
    atomicAmount,
    senderAddress,
    receiverAddress,
  }: {
    blockhash: `0x${string}`;
    sourceTransactionHash: `0x${string}`;
    sourceTransactionIndex: number;
    sourceTimestamp: string;
    atomicAmount: string;
    senderAddress: string;
    receiverAddress: string;
  }) => {
    try {
      if (!address) throw new Error("Connect a Eth account");
      console.log("blockhash", blockhash);
      //verify is this blockhash correct?
      const proof: merkleProof = await getMerkleProof(
        blockhash,
        sourceTransactionIndex
      );
      if (!proof) throw new Error("Failed to fetch proofs from api");

      await validateChain();

      if ((await activeNetworkId()) !== networks.ethereum.id) {
        switchNetwork(networks.ethereum.id);
      }

      const receive = await receiveAvail(proof);
      if (receive) {
        Logger.info(
          `AVAIL_TO_ETH_CLAIM_SUCCESS ${receive} claim_to: ${address} amount: ${atomicAmount}`
        );

        addToLocalTransaction({
          sourceChain: Chain.AVAIL,
          destinationChain: Chain.ETH,
          sourceTransactionHash: sourceTransactionHash,
          destinationTransactionHash: receive,
          amount: atomicAmount,
          status: TransactionStatus.CLAIM_PENDING,
          messageId: 0,
          dataType: "ERC20",
          depositorAddress: "",
          receiverAddress: "",
          sourceBlockHash: "0x",
          sourceBlockNumber: 0,
          sourceTransactionIndex: 0,
          sourceTimestamp: sourceTimestamp,
        });
      }
      return receive;
    } catch (e: any) {
      Logger.error(
        `CLAIM FAILED: ${e}`,
        ["receiver_address", receiverAddress],
        ["sender_address", senderAddress],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", "AVAIL -> ETH"]
      );
      throw e;
    }
  };

  const initClaimEthtoAvail = async ({
    executeParams,
    sourceTransactionHash,
    sourceTimestamp,
    atomicAmount,
  }: {
    sourceTransactionHash: `0x${string}`;
    sourceTimestamp: string;
    atomicAmount: string;
    executeParams: {
      messageid: number;
      amount: string | number;
      from: `${string}`;
      to: `${string}`;
      originDomain: number;
      destinationDomain: number;
    };
  }) => {
    try {
      if (!selected) throw new Error("Connect a Avail account");

      let retriedApiConn: ApiPromise | null = null;

      if (!api || !api.isConnected) {
        Logger.debug("Retrying API Conn");
        retriedApiConn = await initApi();
        setApi(retriedApiConn);
        if (!retriedApiConn || !retriedApiConn.isConnected) {
          throw new Error(
            "Uh Oh! RPC under a lot of stress, error intialising api"
          );
        }
      }

      const heads = await refetchHeads();

      if (!heads && ethHead.slot === 0) {
        throw new Error("Failed to fetch heads from api");
      }

      const proofs = await getAccountStorageProofs(
        ethHead.blockHash,
        executeParams.messageid
      );

      if (!proofs) {
        throw new Error("Failed to fetch proofs from api");
      }

      /**
       * @description Execute transaction to finalize/claim a  ETH -> AVAIL transaction on metamask snap
       */
      if (selected.source === "MetamaskSnap") {
        const execute = await snapVectorExecute({
          api: api ? api : retriedApiConn!,
          executeParams: {
            slot: heads.ethHead.slot,
            addrMessage: {
              message: {
                FungibleToken: {
                  assetId: appConfig.assetId as `0x${string}`,
                  amount: executeParams.amount,
                },
              },
              from: `${executeParams.from.padEnd(66, "0")}`,
              to: u8aToHex(decodeAddress(executeParams.to)),
              originDomain: executeParams.originDomain,
              destinationDomain: executeParams.destinationDomain,
              id: executeParams.messageid,
            },
            accountProof: proofs.accountProof,
            storageProof: proofs.storageProof,
          },
        });

        await addToLocalTransaction({
          sourceChain: Chain.ETH,
          destinationChain: Chain.AVAIL,
          sourceTransactionHash: sourceTransactionHash,
          destinationTransactionHash: execute.txHash,
          amount: atomicAmount,
          status: TransactionStatus.CLAIM_PENDING,
          messageId: 0,
          dataType: "ERC20",
          depositorAddress: "",
          receiverAddress: "",
          sourceBlockHash: "0x",
          sourceBlockNumber: 0,
          sourceTransactionIndex: 0,
          sourceTimestamp: sourceTimestamp,
        });

        Logger.info(
          `ETH_TO_AVAIL_CLAIM_SUCCESS ${execute.txHash} claim_to: ${executeParams.to} amount: ${atomicAmount}`
        );
        return execute;
      }

      /**
       * @description Execute transaction to finalize/claim a ETH -> AVAIL transaction on all other substrate based wallets
       */
      const execute = await executeTransaction(
        {
          slot: heads.ethHead.slot,
          addrMessage: {
            message: {
              FungibleToken: {
                assetId: appConfig.assetId as `0x${string}`,
                amount: executeParams.amount,
              },
            },
            from: `${executeParams.from.padEnd(66, "0")}`,
            to: u8aToHex(decodeAddress(executeParams.to)),
            originDomain: executeParams.originDomain,
            destinationDomain: executeParams.destinationDomain,
            id: executeParams.messageid,
          },
          accountProof: proofs.accountProof,
          storageProof: proofs.storageProof,
        },
        selected!,
        api ? api : retriedApiConn!
      );

      addToLocalTransaction({
        sourceChain: Chain.ETH,
        destinationChain: Chain.AVAIL,
        sourceTransactionHash: sourceTransactionHash,
        destinationTransactionHash: execute.txHash,
        amount: atomicAmount,
        status: TransactionStatus.CLAIM_PENDING,
        messageId: 0,
        dataType: "ERC20",
        depositorAddress: "",
        receiverAddress: "",
        sourceBlockHash: "0x",
        sourceBlockNumber: 0,
        sourceTransactionIndex: 0,
        sourceTimestamp: sourceTimestamp,
      });

      Logger.info(
        `ETH_TO_AVAIL_CLAIM_SUCCESS ${execute.txHash} claim_to: ${executeParams.to} amount: ${atomicAmount}`
      );
      return execute;
    } catch (e: any) {
      Logger.error(
        `CLAIM FAILED: ${e}`,
        ["receiver_address", executeParams.to],
        ["sender_address", executeParams.from],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", "ETH -> AVAIL"]
      );
      throw e;
    }
  };

  return { initClaimAvailToEth, initClaimEthtoAvail };
}