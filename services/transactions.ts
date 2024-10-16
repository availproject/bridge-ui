import axios from "axios";
import { appConfig } from "@/config/default";
import { Transaction } from "@/types/transaction";
import { Chain } from "@/types/common";
import { Logger } from "@/utils/logger";

const indexerInstance = axios.create({
    baseURL: appConfig.bridgeIndexerBaseUrl,
    headers: { "Access-Control-Allow-Origin": "*" },
    withCredentials: false
});

type TransactionQueryParams = {
    availAddress?: string;
    ethAddress?: string;
    sourceChain?: string;
    destinationChain?: string;
};

function validateParams({ availAddress, ethAddress }: TransactionQueryParams) {
    if (!availAddress && !ethAddress) {
        Logger.info("Either availAddress or ethAddress must be provided.")
        return [];
     
    }
}

/** 
 * @description Fetches transactions from the indexer
 *      
 * @param userAddress
 * @param sourceChain
 * @param destinationChain
 * @returns  List of transactions
*/
async function fetchTransactions(userAddress: string, sourceChain?: string, destinationChain?: string): Promise<Transaction[]> {
    try {
        const response = await indexerInstance.get(`/transactions`, {
            params: {
                userAddress,
                sourceChain,
                destinationChain,
                limit: 100,
                page: 0,
            },
        });
        return response.data.data.result;
    } catch (e: any) {
        Logger.error(`ERROR_FETCHING_TRANSACTIONS: ${e}`);
        return [];
    }
}


/**
 * @description Fetches transactions and adds to store, based on wallet logged in
 * 
 * @param {TransactionQueryParams} 
 * @returns Transaction[]
 */
export const getTransactionsFromIndexer = async (
    { availAddress, ethAddress, sourceChain, destinationChain }: TransactionQueryParams
): Promise<Transaction[]> => {
    validateParams({ availAddress, ethAddress });

    const allTransactions: Transaction[] = [];
    const seenHashes = new Set<string>();

    const addUniqueTransactions = (transactions: Transaction[]) => {
        transactions.forEach(txn => {
            if (!seenHashes.has(txn.sourceTransactionHash)) {
                seenHashes.add(txn.sourceTransactionHash);
                allTransactions.push(txn);
            }
        });
    };
    if (ethAddress) {
        const ethTransactions = await fetchTransactions(ethAddress, Chain.ETH, destinationChain);
        addUniqueTransactions(ethTransactions);
        const receiverEthTransactions = await fetchTransactions(ethAddress, Chain.AVAIL, destinationChain);
        addUniqueTransactions(receiverEthTransactions);
    }

    if (availAddress) {
        const availTransactions = await fetchTransactions(availAddress, Chain.AVAIL, destinationChain);
        addUniqueTransactions(availTransactions);
        const receiverAvailTransactions = await fetchTransactions(availAddress, Chain.ETH, destinationChain);
        addUniqueTransactions(receiverAvailTransactions);
    }

    return allTransactions;
};
