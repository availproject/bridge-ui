import { appConfig } from "@/config/default";
import { LatestBlockInfo } from "@/stores/lastestBlockInfo";
import { AccountStorageProof, merkleProof } from "@/types/transaction";
import { initialize } from "avail-js-sdk";
import axios from "axios";
import jsonbigint from "json-bigint";
const JSONBigInt = jsonbigint({ useNativeBigInt: true });

/**
 * @description Fetches the merkle proof for a given blockhash and index
 * @flow AVAIL -> ETH
 * 
 * @param blockhash 
 * @param index 
 * @returns merkleProof
 */
export const getMerkleProof = async (blockhash: string, index: number) => {
  const response = await axios.get(`${appConfig.bridgeApiBaseUrl}/eth/proof/${blockhash}`, {
    params: { index },
    transformResponse: [data => data]
  });
  const proof: merkleProof = JSONBigInt.parse(response.data);

  return proof;
};


/**
 * @description Fetches the latest eth block on avail
 * @returns LatestBlockInfo["avlhead"]
 */
export async function fetchAvlHead(): Promise<{
  data: LatestBlockInfo["avlHead"];
}> {
  const response = await fetch(`${appConfig.bridgeApiBaseUrl}/avl/head`);

  const avlHead: LatestBlockInfo["avlHead"] = await response.json();
  return { data: avlHead };
}


/**
 * @description Fetches the latest slot on eth
 * @returns LatestBlockInfo["ethHead"]
 */
export async function fetchEthHead(): Promise<{
  data: LatestBlockInfo["ethHead"];
}> {
  const response = await fetch(`${appConfig.bridgeApiBaseUrl}/eth/head`);
  const ethHead: LatestBlockInfo["ethHead"] = await response.json();
  return { data: ethHead };
}


/**
 * @description Fetches the latest blockhash for a given slot
 * @param slot 
 * @returns LatestBlockInfo["latestBlockhash"]
 */
export async function fetchLatestBlockhash(
  slot: LatestBlockInfo["ethHead"]["slot"]
): Promise<{ data: LatestBlockInfo["latestBlockhash"] }> {
  const response = await fetch(
    `${appConfig.bridgeApiBaseUrl}/beacon/slot/${slot}`
  );
  const latestBlockhash: LatestBlockInfo["latestBlockhash"] =
    await response.json();
  return { data: latestBlockhash };
}

/**
 * @description Fetches the account storage proofs for a given blockhash and messageid
 * @flow ETH -> AVAIL
 * 
 * @param blockhash 
 * @param messageid 
 * @returns  AccountStorageProof
 */
export async function getAccountStorageProofs(
  blockhash: string,
  messageid: number
) {
  const response = await fetch(`${appConfig.bridgeApiBaseUrl}/avl/proof/${blockhash}/${messageid}`)
    .catch((e) => {
      console.log(e);
      return Response.error();
    });

  const result: AccountStorageProof = await response.json();
  return result;
}
