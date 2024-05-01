import axios from "axios";

import { appConfig } from "@/config/default";
import { TxnData, merkleProof } from "@/types/transaction";

const indexerInstance = axios.create({
    baseURL: appConfig.bridgeIndexerBaseUrl,
    headers: { "Access-Control-Allow-Origin": "*" },
    withCredentials: false
});

const bridgeApiInstance = axios.create({
    baseURL: appConfig.bridgeApiBaseUrl,
    headers: { "Access-Control-Allow-Origin": "*" },
    withCredentials: false
});

export const getTransactionsFromIndexer = async (userAddress: string, sourceChain: string, destinationChain: string) => {
    const response = await indexerInstance
        .get(`/transactions`, {
            params: {
                // userAddress: userAddress,
                sourceChain: sourceChain,
                destinationChain: destinationChain,
            },
        })
        .catch((e) => {
            console.log(e);
            return { data: { result: [] } };
        });

    const result: TxnData[] = response.data.result;
    return result;
}

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
