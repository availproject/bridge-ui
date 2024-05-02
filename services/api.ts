import { appConfig } from "@/config/default";
import { merkleProof } from "@/types/transaction";
import axios from "axios";


const bridgeApiInstance = axios.create({
  baseURL: appConfig.bridgeApiBaseUrl,
  headers: { "Access-Control-Allow-Origin": "*" },
  withCredentials: false
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
}
