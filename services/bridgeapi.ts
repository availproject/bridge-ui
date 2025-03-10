import { appConfig } from "@/config/default";
import { IAddress } from "@/hooks/wormhole/helper";
import { LatestBlockInfo } from "@/stores/blockinfo";
import {
  Chain,
  PayloadResponse,
  TransactionStatus,
} from "@/types/common";
import {
  AccountStorageProof,
  merkleProof,
  Transaction,
} from "@/types/transaction";
import { validAddress } from "@/utils/common";
import { Logger } from "@/utils/logger";
import { ApiPromise, isValidAddress } from "avail-js-sdk";
import axios from "axios";
import jsonbigint from "json-bigint";
import { ResultAsync } from "neverthrow";
import { encodeAddress } from "@polkadot/util-crypto";
const JSONBigInt = jsonbigint({ useNativeBigInt: true });

const trim0x = (value: string) =>
  value.startsWith("0x") ? value.slice(2) : value;


export const getMerkleProof = async (blockhash: string, index: number) => {
  const response = await axios.get(
    `${appConfig.bridgeApiBaseUrl}/eth/proof/${blockhash}`,
    {
      params: { index },
      transformResponse: [(data) => data],
    }
  );
  const proof: merkleProof = JSONBigInt.parse(response.data);

  return proof;
};

export async function fetchAvlHead(api: ApiPromise): Promise<{
  data: LatestBlockInfo["avlHead"];
}> {
  const response = await fetch(`${appConfig.bridgeApiBaseUrl}/avl/head`);
  const avlHead: LatestBlockInfo["avlHead"] = await response.json();
  const blockHash = await api.rpc.chain.getBlockHash(avlHead.data.end);
  const block = await api.rpc.chain.getBlock(blockHash);
  const timestamp = parseInt(
    block.block.extrinsics[0].args[0].toJSON() as string
  );

  return { data: { data: { ...avlHead.data, endTimestamp: timestamp } } };
}

export async function fetchEthHead(): Promise<{
  data: LatestBlockInfo["ethHead"];
}> {
  const response = await fetch(`${appConfig.bridgeApiBaseUrl}/v1/eth/head`);
  const ethHead: LatestBlockInfo["ethHead"] = await response.json();
  return { data: ethHead };
}

export async function getAccountStorageProofs(
  blockhash: string,
  messageid: number
) {
  const response = await fetch(
    `${appConfig.bridgeApiBaseUrl}/v1/avl/proof/${blockhash}/${messageid}`
  ).catch((e: any) => {
    Logger.error(e);
    return Response.error();
  });

  const result: AccountStorageProof = await response.json();
  return result;
}

export async function fetchTokenPrice({
  coin,
  fiat,
}: {
  coin: string;
  fiat: string;
}): Promise<number> {
  const response = await fetch(
    `/api/getTokenPrice?coins=${coin}&fiats=${fiat}`
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `status: ${response.status}, message: ${
        errorData.error || "Unknown error"
      }`
    );
  }
  const data = await response.json();
  return Number(data.price[coin][fiat]);
}

export const sendPayload = (
  body: string,
  sig: string,
  direction: string,
  publicKey?: string
): ResultAsync<PayloadResponse, Error> =>
  ResultAsync.fromPromise(
    axios.post(`${appConfig.liquidityBridgeApiBaseUrl}/v1/${direction}`, body, {
      headers: {
        "X-Payload-Signature": trim0x(sig),
        ...(publicKey && { "X-Public-Key": trim0x(publicKey) }),
      },
    }),
    (error: any) => new Error(`Failed to send payload: ${error.message}`)
  ).map((response) => response.data);

export interface ReviewResponse {
  fee: string;
  time: number;
}

export const reviewTxn = (
  atomicAmount: string,
  fromChain: Chain
): ResultAsync<ReviewResponse, Error> => {
  return ResultAsync.fromPromise(
    axios.get(
      `${appConfig.liquidityBridgeApiBaseUrl}/v1/${
        fromChain === Chain.AVAIL ? "avail_to_eth" : "eth_to_avail"
      }/review_transaction/${atomicAmount}`
    ),
    (error) => new Error(`Failed to review transaction: ${error}`)
  ).map((response) => response.data);
};

export const fetchAvailToEVMTransactions = async (
  availAddress: string
): Promise<Transaction[]> => {
  if (!isValidAddress(availAddress)) {
    return [];
  }

  try {
    const response = await fetch(
      `${appConfig.liquidityBridgeApiBaseUrl}/v1/avail_to_eth/status?sender_address=${availAddress}`
    );

    if (!response.ok)
      throw new Error("Failed to fetch Avail to ETH transactions");
    const transactions = await response.json();

    console.log("transactions:", transactions);

    interface IAvailtoEVMResponse {
      amount: string;
      amount_transferred: string;
      bridged_tx_hash: string;
      completed_at: string;
      created_at: string;
      id: number;
      receiver_hash: string;
      sender_hash: string;
      source_block_hash: string;
      source_extrinsic_hash: string;
      status: string;
      tx_index: number;
    }

    return transactions.map((tx: IAvailtoEVMResponse) => ({
      status:
        tx.status === "Bridged"
          ? TransactionStatus.CLAIMED
          : TransactionStatus.PENDING,
      sourceChain: Chain.AVAIL,
      //@luka-ethernal need to get this back from the api as well, no way to handle this on the FE, for multiple ERC20 chains
      destinationChain: Chain.BASE,
      amount: tx.amount,
      depositorAddress: encodeAddress(tx.sender_hash),
      receiverAddress: tx.receiver_hash,
      sourceTransactionHash: tx.source_extrinsic_hash,
      // add time left
      sourceTimestamp: new Date(tx.created_at).getTime(),
      destinationTransactionHash: tx.bridged_tx_hash || undefined,
      destinationTransactionTimestamp: tx.completed_at
        ? new Date(tx.completed_at).getTime()
        : undefined,
    })) as Transaction[];
  } catch (err) {
    throw err;
  }
};

export const fetchEVMToAvailTransactions = async (
  ethAddress: IAddress
): Promise<Transaction[]> => {
  if (!validAddress(ethAddress, Chain.ETH)) {
    return [];
  }

  try {
    const response = await fetch(
      `${appConfig.liquidityBridgeApiBaseUrl}/v1/eth_to_avail/status?sender_address=${ethAddress}`
    );

    if (!response.ok)
      throw new Error("Failed to fetch ETH to Avail transactions");
    const transactions = await response.json();

    interface IEVMtoAvailResponse {
      amount: string;
      amount_transferred: string;
      bridged_block_hash: string;
      bridged_tx_index: number;
      bridged_extrinsic_hash: string;
      completed_at: string;
      created_at: string;
      id: number;
      receiver_hash: string;
      sender_hash: string;
      status: string;
      tx_hash: string;
    }

    return transactions.map((tx: IEVMtoAvailResponse) => ({
      status:
        tx.status === "Bridged"
          ? TransactionStatus.CLAIMED
          : TransactionStatus.PENDING,
      sourceChain: Chain.BASE,
      destinationChain: Chain.AVAIL,
      amount: tx.amount,
      depositorAddress: tx.sender_hash,
      receiverAddress: encodeAddress(tx.receiver_hash),
      sourceTransactionHash: tx.tx_hash,
      sourceTimestamp: new Date(tx.created_at).getTime(),
      destinationTransactionHash: tx.bridged_extrinsic_hash,
      // add time left
      detinationBlockhash: tx.bridged_block_hash,
      destinationTransactionTimestamp: tx.completed_at
        ? new Date(tx.completed_at).getTime()
        : undefined,
    })) as Transaction[];
  } catch (err) {
    throw err;
  }
};

export const fetchAllLiquidityBridgeTransactions = async (
  isPolling = false,
  address?: IAddress
): Promise<Transaction[]> => {
  if (!address) {
    return [];
  }

  try {
    const [availToEthTxs, ethToAvailTxs] = await Promise.all([
      fetchAvailToEVMTransactions(address),
      fetchEVMToAvailTransactions(address),
    ]);

    return [...availToEthTxs, ...ethToAvailTxs];
  } catch (err) {
    throw err;
  }
};
