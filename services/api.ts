import { appConfig } from "@/config/default";
import { substrateConfig } from "@/config/walletConfig";
import { LatestBlockInfo } from "@/stores/lastestBlockInfo";
import { AccountStorageProof, merkleProof } from "@/types/transaction";
import { initialize } from "avail-js-sdk";


/**
 * @description Fetches the merkle proof for a given blockhash and index
 * @flow AVAIL -> ETH
 * 
 * @param blockhash 
 * @param index 
 * @returns merkleProof
 */
export const getMerkleProof = async (blockhash: string, index: number) => {
  const response = await fetch(`${appConfig.bridgeApiBaseUrl}/eth/proof/${blockhash}?index=${index}`);
  const proof: merkleProof = await response.json();
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
  //TODO: Change below as response.json() does not contain endTimestamp.
  const avlHead: LatestBlockInfo["avlHead"] = await response.json();
  const api = await initialize(substrateConfig.endpoint);
  const blockHash = await api.rpc.chain.getBlockHash(avlHead.data.end);
  const block = await api.rpc.chain.getBlock(blockHash);
  //Get first extrinsic which is timestamp.set, and extract the arg with timestamp.
  const timestamp = parseInt(block.block.extrinsics[0].args[0].toJSON() as string);

  //TODO avoid opening multiple wss connections.
  return { data: { data: { ...avlHead.data, endTimestamp: timestamp } } };
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
