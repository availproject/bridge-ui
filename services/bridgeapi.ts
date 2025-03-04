import { appConfig } from "@/config/default";
import { IAddress } from "@/hooks/wormhole/helper";
import { LatestBlockInfo } from "@/stores/blockinfo";
import { Chain, LiquidityBridgeTransactionBody, PayloadResponse, TransactionStatus } from "@/types/common";
import { AccountStorageProof, merkleProof, Transaction } from "@/types/transaction";
import { validAddress } from "@/utils/common";
import { Logger } from "@/utils/logger";
import { ApiPromise, isValidAddress } from "avail-js-sdk";
import axios from "axios";
import jsonbigint from "json-bigint";
import { ResultAsync } from "neverthrow";
const JSONBigInt = jsonbigint({ useNativeBigInt: true });


const trim0x = (value: string) => value.startsWith('0x') ? value.slice(2) : value

export const getMerkleProof = async (blockhash: string, index: number) => {
  const response = await axios.get(`${appConfig.bridgeApiBaseUrl}/eth/proof/${blockhash}`, {
    params: { index },
    transformResponse: [data => data]
  });
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
  const timestamp = parseInt(block.block.extrinsics[0].args[0].toJSON() as string);

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
  const response = await fetch(`${appConfig.bridgeApiBaseUrl}/v1/avl/proof/${blockhash}/${messageid}`)
    .catch((e: any) => {
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
      `status: ${response.status}, message: ${errorData.error || "Unknown error"}`
    );
  }
  const data = await response.json();
  return Number(data.price[coin][fiat]);
};

export const sendPayload = (
    body: string,
    sig: string,
    direction: string,
    publicKey?: string
  ): ResultAsync<PayloadResponse, Error> =>
    ResultAsync.fromPromise(
      axios.post(
        `${appConfig.liquidityBridgeApiBaseUrl}/v1/${direction}`,
        body,
        {
          headers: {
            "X-Payload-Signature": trim0x(sig),
            ...(publicKey && { "X-Public-Key": trim0x(publicKey) }),
          },
        }
      ),
      (error: any) => new Error(`Failed to send payload: ${error.message}`)
    ).map((response) => response.data);

export interface ReviewResponse {
  avail_to_eth_fee: string;
  time: number
  eth_to_avail_fee: string;
}

export const reviewTxn = (atomicAmount: string) : ResultAsync<ReviewResponse, Error> => {
  return ResultAsync.fromPromise(
    axios.get(`${appConfig.liquidityBridgeApiBaseUrl}/v1/review_transaction/${atomicAmount}`),
    (error) => new Error(`Failed to review transaction: ${error}`)
  ).map((response) => response.data);
}

export const fetchAvailToERC20AvailTransactions = async (address: IAddress | string): Promise<Transaction[]> => {
  if (!isValidAddress(address)) {
    return [];
  }

  try {
    const response = await fetch(
      `${appConfig.liquidityBridgeApiBaseUrl}/v1/avail_to_eth/status?sender_address=${address}`
    );

    if (!response.ok) throw new Error('Failed to fetch Avail to ETH transactions');
    const transactions = await response.json();

    console.log('transactions:', transactions);

    return transactions.map((tx: any) => ({
      status: tx.status === 'Bridged' ? TransactionStatus.CLAIMED : TransactionStatus.PENDING,
      sourceChain: Chain.AVAIL,
      //@luka-ethernal need to get this back from the api as well, no way to handle this on the FE, for multiple ERC20 chains
      destinationChain: Chain.BASE,
      amount: tx.amount,
      depositorAddress: tx.sender_address,
      receiverAddress: tx.eth_receiver_address,
      sourceTransactionHash: tx.block_hash,
      sourceTimestamp: new Date(tx.created_at).getTime(),
      destinationTransactionHash: tx.bridged_tx_hash || undefined,
      destinationTransactionTimestamp: tx.completed_at 
        ? new Date(tx.completed_at).getTime() 
        : undefined
    })) as Transaction[];

  } catch (err) {
    throw err;
  }
};

export const fetchERC20AvailToAvailTransactions = async (address: IAddress): Promise<Transaction[]> => {
  if (!validAddress(address, Chain.ETH)) {
    return [];
  }

  try {
    const response = await fetch(
      `${appConfig.liquidityBridgeApiBaseUrl}/v1/eth_to_avail/status?sender_address=${address}`
    );

    if (!response.ok) throw new Error('Failed to fetch ETH to Avail transactions');
    
    const transactions = await response.json();

    return transactions.map((tx: any) => ({
      status: tx.status === 'Bridged' ? TransactionStatus.CLAIMED : TransactionStatus.PENDING,
      sourceChain: Chain.BASE,
      destinationChain: Chain.AVAIL,
      amount: tx.amount,
      depositorAddress: tx.sender_public_key,
      receiverAddress: tx.avl_receiver_address,
      sourceTransactionHash: tx.tx_hash,
      sourceTimestamp: new Date(tx.created_at).getTime(),
      destinationTransactionHash: tx.bridged_block_hash || undefined,
      destinationTransactionTimestamp: tx.completed_at 
        ? new Date(tx.completed_at).getTime() 
        : undefined
    })) as Transaction[];

  } catch (err) {
    throw err;
  }
};

export const fetchAllLiquidityBridgeTransactions = async (isPolling = false, address?: IAddress): Promise<Transaction[]> => {
  if (!address) {
    return [];
  }

  try {
    const [availToEthTxs, ethToAvailTxs] = await Promise.all([
      fetchAvailToERC20AvailTransactions(address),
      fetchERC20AvailToAvailTransactions(address)
    ]);

    return [...availToEthTxs, ...ethToAvailTxs];
  } catch (err) {
    throw err;
  }
};