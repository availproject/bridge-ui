import { appConfig } from "@/config/default";
import { LatestBlockInfo } from "@/stores/lastestBlockInfo";
import { AccountStorageProof, merkleProof } from "@/types/transaction";
import axios from "axios";

const bridgeApiInstance = axios.create({
  baseURL: appConfig.bridgeApiBaseUrl,
  withCredentials: true,
});

export const getMerkleProof = async (blockhash: string, index: number) => {
  const response = await fetch(`${appConfig.bridgeApiBaseUrl}/eth/proof/${blockhash}?index=${index}`);
  const proof: merkleProof = await response.json();
  return proof;
};

export async function fetchAvlHead(): Promise<{
  data: LatestBlockInfo["avlHead"];
}> {
  const response = await fetch(`${appConfig.bridgeApiBaseUrl}/avl/head`);

  const avlHead: LatestBlockInfo["avlHead"] = await response.json();
  return { data: avlHead };
}

export async function fetchEthHead(): Promise<{
  data: LatestBlockInfo["ethHead"];
}> {
  const response = await fetch(`${appConfig.bridgeApiBaseUrl}/eth/head`);
  const ethHead: LatestBlockInfo["ethHead"] = await response.json();
  return { data: ethHead };
}

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
