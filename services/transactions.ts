import axios from "axios";
import { appConfig } from "@/config/default";
import { Transaction } from "@/types/transaction";
import { Chain } from "@/types/common";
import { Logger } from "@/utils/logger";
import { fetchWormholeTransactions } from "@/hooks/wormhole/helper";

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
        const transactions = response.data.data.result;
        if (destinationChain) {
            return transactions.map((transaction: Transaction) => ({
                ...transaction,
                destinationChain,
            }));
        }

        return transactions;
    } catch (e: any) {
        Logger.error(`ERROR_FETCHING_TRANSACTIONS: ${e}`);
        return [];
    }
}

const fetchWithErrorHandling = async (address: string, source: Chain, dest?: Chain) => {
    try {
        return await fetchTransactions(address, source, dest);
    } catch (error) {
        Logger.error(`Failed to fetch transactions for ${address} from ${source} to ${dest}: ${error}`);
        return [];
    }
};

/**
 * @description Fetches transactions and adds to store, based on wallet logged in
 * 
 * @param {TransactionQueryParams} 
 * @returns Transaction[]
 */
export const getAllTransactions = async (
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

    const fetchPromises: Promise<Transaction[]>[] = [];
    
    if (ethAddress) {
        fetchPromises.push(
            fetchWithErrorHandling(ethAddress, Chain.ETH, Chain.AVAIL),
            fetchWithErrorHandling(ethAddress, Chain.AVAIL, Chain.ETH),
            fetchWormholeTransactions(false, ethAddress)
        );
    }

    if (availAddress) {
        fetchPromises.push(
            fetchWithErrorHandling(availAddress, Chain.AVAIL, Chain.ETH),
            fetchWithErrorHandling(availAddress, Chain.ETH, Chain.AVAIL)
        );
    }

    const results = await Promise.all(fetchPromises);
    results.forEach(addUniqueTransactions);

    return allTransactions;
};
