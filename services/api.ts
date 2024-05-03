import { appConfig } from "@/config/default";
import { LatestBlockInfo } from "@/stores/lastestBlockInfo";
import { AccountStorageProof, merkleProof } from "@/types/transaction";
import axios from "axios";

const bridgeApiInstance = axios.create({
  baseURL: appConfig.bridgeApiBaseUrl,
  headers: { "Access-Control-Allow-Origin": "*" },
  withCredentials: false,
});

export const getMerkleProof = async (blockhash: string, index: number) => {
  const response = await bridgeApiInstance
    .get(`/eth/proof/${blockhash}`, {
      params: {
        index,
      },
    })
    .catch((e) => {
      console.log(e);
      return { data: [] };
    });

  const result: merkleProof = response.data;
  return result;
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
  const response = await bridgeApiInstance
    .get(`/avl/proof/${blockhash}`, {
      params: {
        messageid,
      },
    })
    .catch((e) => {
      console.log(e);
      return { data: [] };
    });

  const result: AccountStorageProof = response.data;
  return result;
}
