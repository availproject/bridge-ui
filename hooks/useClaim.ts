import { ApiPromise } from "avail-js-sdk";
import { writeContract } from "@wagmi/core";
import { useAccount } from "wagmi";
import { encodeAbiParameters, formatUnits } from "viem";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";

import { executeParams, merkleProof } from "@/types/transaction";
import { Chain, TransactionStatus } from "@/types/common";
import { 
 Transaction as MetamaskTransaction,
 TxPayload 
} from "@avail-project/metamask-avail-types";

import { 
 fetchEthHead,
 getAccountStorageProofs,
 getMerkleProof 
} from "@/services/bridgeapi";
import { executeTransaction } from "@/services/pallet";

import { useAvailAccount } from "@/stores/availwallet";
import { useApi } from "@/stores/api";
import useTransactions from "./useTransactions";
import useEthWallet from "./useEthWallet";
import { useInvokeSnap } from "./Metamask/useInvokeSnap";

import { appConfig } from "@/config/default";
import { config } from "@/config/walletConfig";
import bridgeImplAbi from "@/constants/abis/bridgeImplAbi.json";

import { Logger } from "@/utils/logger";
import { checkTransactionStatus } from "./Metamask/utils";

export default function useClaim() {
  
  const { validateandSwitchChain } = useEthWallet();
  const { selected } = useAvailAccount();
  const { address } = useAccount();
  const { addToLocalTransaction } = useTransactions();
  const { api, ensureConnection } = useApi();
  const invokeSnap = useInvokeSnap();

  /** HELPER FUNCTIONS */
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

  async function snapVectorExecute({
    api,
    executeParams,
  }: {
    api: ApiPromise;
    executeParams: executeParams;
  }) {
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
  }

  /** CLAIM FLOWS */
  type AvailToEthClaimParams = {
    blockhash: `0x${string}`;
    sourceTransactionHash: `0x${string}`;
    sourceTransactionIndex: number;
    sourceTimestamp: string;
    atomicAmount: string;
    senderAddress: string;
    receiverAddress: string;
  }; 

  const initClaimAvailToEth = async ({
    blockhash,
    sourceTransactionHash,
    sourceTransactionIndex,
    sourceTimestamp,
    atomicAmount,
    senderAddress,
    receiverAddress,
  }: AvailToEthClaimParams) => {
    try {
      if (!address) throw new Error("Connect a Eth account");
      await validateandSwitchChain(Chain.ETH);

      const proof: merkleProof = await getMerkleProof(
        blockhash,
        sourceTransactionIndex
      );
      if (!proof) throw new Error("Failed to fetch proofs from api");

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

  type AvailClaimParams = {
    executeParams: {
      messageid: number;
      amount: string | number;
      from: `${string}`;
      to: `${string}`;
      originDomain: number;
      destinationDomain: number;
    };
    sourceTransactionHash: `0x${string}`;
    sourceTimestamp: string;
    atomicAmount: string;
  };

  const initClaimEthtoAvail = async ({
    executeParams,
    sourceTransactionHash,
    sourceTimestamp,
    atomicAmount,
  }: AvailClaimParams) => {
    try {
      if (!selected) throw new Error("Connect a Avail account");

      if (!api || !api.isConnected || !api.isReady) await ensureConnection();
      if (!api?.isReady)
        throw new Error("Uh oh! Failed to connect to Avail Api");

      const ethhead = await fetchEthHead();
      if (!ethhead.data || ethhead.data.slot === 0)
        throw new Error("Failed to fetch heads from api");

      const proofs = await getAccountStorageProofs(
        ethhead.data.blockHash,
        executeParams.messageid
      );
      if (!proofs) {
        throw new Error("Failed to fetch proofs from api");
      }

      const params = {
        slot: ethhead.data.slot,
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
      };

      const execute =
        selected.source === "MetamaskSnap"
          ? await snapVectorExecute({ api: api!, executeParams: params })
          : await executeTransaction(params, selected!, api!);

      addToLocalTransaction({
        sourceTransactionHash: sourceTransactionHash,
        status: TransactionStatus.CLAIM_PENDING,
        sourceTimestamp: sourceTimestamp,
        amount: atomicAmount,
        destinationTransactionHash: execute.txHash,
        sourceChain: Chain.ETH,
        destinationChain: Chain.AVAIL,
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
