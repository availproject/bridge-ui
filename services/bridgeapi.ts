import { appConfig } from "@/config/default";
import { LatestBlockInfo } from "@/stores/blockinfo";
import { LiquidityBridgeTransactionBody, PayloadResponse } from "@/types/common";
import { AccountStorageProof, merkleProof } from "@/types/transaction";
import { Logger } from "@/utils/logger";
import { ApiPromise } from "avail-js-sdk";
import axios from "axios";
import jsonbigint from "json-bigint";
import { ResultAsync } from "neverthrow";
const JSONBigInt = jsonbigint({ useNativeBigInt: true });

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
    direction: string
  ): ResultAsync<PayloadResponse, Error> =>
    ResultAsync.fromPromise(
      axios.post(
        `${appConfig.liquidityBridgeApiBaseUrl}/v1/${direction}`,
        body,
        {
          headers: {
            "X-Payload-Signature": sig,
          },
        }
      ),
      (error) => new Error(`Failed to send payload: ${error}`)
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