import axios from "axios";

import { appConfig } from "@/config/default";
import { TxnData } from "@/types/transaction";

const indexerInstance = axios.create({
    baseURL: appConfig.bridgeIndexerBaseUrl,
    headers: { "Access-Control-Allow-Origin": "*" },
    withCredentials: false
});

// const _chainIdToName = (chainId: number) => {
//     switch (chainId) {
//         case 1:
//             return "ETHEREUM";
//         case 43114:
//             return "AVAIL";
//         default:
//             return null;
//     }
// }

// should ideally have the following params:
//  limit: number,
//  offset: number
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
