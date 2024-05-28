import axios from "axios";

import { appConfig } from "@/config/default";
import { Transaction } from "@/types/transaction";

const indexerInstance = axios.create({
    baseURL: appConfig.bridgeIndexerBaseUrl,
    headers: { "Access-Control-Allow-Origin": "*" },
    withCredentials: false
});

// todo: will need pagination in near future
type TransactionQueryParams = {
    availAddress?: string;
    ethAddress?: string;
    sourceChain?: string;
    destinationChain?: string;
};

function validateParams({ availAddress, ethAddress }: TransactionQueryParams) {
    if (!availAddress && !ethAddress) {
        console.log("Either availAddress or ethAddress must be provided.")
        return [];
       
     
    }
}

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
        return response.data.result;
    } catch (e) {
        console.error(e);
        return [];
    }
}

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
        const ethTransactions = await fetchTransactions(ethAddress, sourceChain, destinationChain);
        addUniqueTransactions(ethTransactions);
    }

    if (availAddress) {
        const availTransactions = await fetchTransactions(availAddress, sourceChain, destinationChain);
        addUniqueTransactions(availTransactions);
    }

    return allTransactions;
};
