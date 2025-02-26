import axios from "axios";
import { appConfig } from "@/config/default";
import { Transaction } from "@/types/transaction";
import { TransactionResponseType } from "@/types/common";
import { Logger } from "@/utils/logger";
import { fetchWormholeTransactions } from "@/hooks/wormhole/helper";

const bridgeApiInstance = axios.create({
  baseURL: appConfig.bridgeApiBaseUrl,
  headers: { "Access-Control-Allow-Origin": "*" },
  withCredentials: false,
});

type TransactionQueryParams = {
  availAddress?: string;
  ethAddress?: string;
};

function validateParams({ availAddress, ethAddress }: TransactionQueryParams) {
    if (!availAddress && !ethAddress) {
        Logger.info("Either availAddress or ethAddress must be provided.")
        return [];
     
    }
}

function validateTransactionResponseType(queryParam: string) : string {
    const chainAddressResponseMapping: Record<string, TransactionResponseType> = Object.freeze({
        "ethAddress": TransactionResponseType.ETH_SEND,
        "availAddress": TransactionResponseType.AVAIL_SEND
    })
    return chainAddressResponseMapping[queryParam];
}

/**
 * @description Fetches transactions from the indexer
 *
 * @param address
 * @param queryParam
 * @returns  List of transactions
 */
async function fetchTransactions(
  address: string,
  queryParam: string
): Promise<Transaction[]> {
  try {
    const response = await bridgeApiInstance.get(`/transactions`, {
      params: {
        [queryParam]: address,
      },
    });
    return response.data[validateTransactionResponseType(queryParam)];
  } catch (e: any) {
    Logger.error(`ERROR_FETCHING_TRANSACTIONS: ${e}`);
    return [];
  }
}

const fetchWithErrorHandling = async (address: string, queryParam: string) => {
  try {
    return await fetchTransactions(address, queryParam);
  } catch (error) {
    Logger.error(
      `Failed to fetch transactions for ${address} from ${queryParam}: ${error}`
    );
    return [];
  }
};

/**
 * @description Fetches transactions and adds to store, based on wallet logged in
 * 
 * @param {TransactionQueryParams} 
 * @returns Transaction[]
 */
export const getAllTransactions = async ({
  availAddress,
  ethAddress,
}: TransactionQueryParams): Promise<Transaction[]> => {
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
        fetchPromises.push(fetchWithErrorHandling(ethAddress, "ethAddress"));
    }

    if (availAddress) {
        fetchPromises.push(fetchWithErrorHandling(availAddress, "availAddress"));
    }

    const results = await Promise.all(fetchPromises);
    results.forEach(addUniqueTransactions);

    return allTransactions;
};
