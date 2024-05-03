import axios from "axios";

import { appConfig } from "@/config/default";
import { Transaction } from "@/types/transaction";

const indexerInstance = axios.create({
    baseURL: appConfig.bridgeIndexerBaseUrl,
    headers: { "Access-Control-Allow-Origin": "*" },
    withCredentials: false
});

// todo: will need pagination in near future
export const getTransactionsFromIndexer = async (userAddress: string, sourceChain?: string, destinationChain?: string) => {
    const response = await indexerInstance
        .get(`/transactions`, {
            params: {
                userAddress: userAddress,
                sourceChain: sourceChain,
                destinationChain: destinationChain,
                limit: 100,
                page: 0,
            },
        })
        .catch((e) => {
            console.log(e);
            return { data: { result: [] } };
        });

    // todo: remove this filter once API is fixed
    const result: Transaction[] = response.data.result

    // mock transactions api
    /*
        return [{
            "status": "READY_TO_CLAIM",
            "destinationChain": "AVAIL",
            "messageId": 1169,
            "sourceChain": "ETHEREUM",
            "amount": "1230000000000000000",
            "dataType": "ERC20",
            "depositorAddress": "0x2254e4d1b41f2dd3969a79b994e6ee8c3c6f2c71",
            "receiverAddress": "5HEt5VbgdoiKMJtmFfbtFLphw1yiuus6kf2PA39oukqhtUAQ",
            "sourceBlockHash": "0xbca24c71342a93158d92c81b50f43d3c3fd9088f1227bbe4b5a36875ad8c26fe",
            "sourceTransactionBlockNumber": 5811152,
            "sourceTransactionHash": "0xabc",
            "sourceTransactionIndex": 66,
            "sourceTransactionTimestamp": "2024-04-30T21:31:48.000Z"
        }, {
            "status": "READY_TO_CLAIM",
            "destinationChain": "AVAIL",
            "messageId": 1169,
            "sourceChain": "ETHEREUM",
            "amount": "4560000000000000000",
            "dataType": "ERC20",
            "depositorAddress": "0x2254e4d1b41f2dd3969a79b994e6ee8c3c6f2c71",
            "receiverAddress": "5HEt5VbgdoiKMJtmFfbtFLphw1yiuus6kf2PA39oukqhtUAQ",
            "sourceBlockHash": "0xbca24c71342a93158d92c81b50f43d3c3fd9088f1227bbe4b5a36875ad8c26fe",
            "sourceTransactionBlockNumber": 5811152,
            "sourceTransactionHash": "0xdef",
            "sourceTransactionIndex": 66,
            "sourceTransactionTimestamp": "2024-04-20T21:31:48.000Z"
        },]
        */
    return result;
}
