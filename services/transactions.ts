import axios from "axios";
import { appConfig } from "@/config/default";
import { Transaction } from "@/types/transaction";
import { Chain } from "@/types/common";
import { Logger } from "@/utils/logger";
import { fetchWormholeTransactions } from "@/hooks/wormhole/helper";
import { fetchAllLiquidityBridgeTransactions } from "./bridgeapi";

const indexerInstance = axios.create({
  baseURL: appConfig.bridgeIndexerBaseUrl,
  headers: { "Access-Control-Allow-Origin": "*" },
  withCredentials: false,
});

type TransactionQueryParams = {
  availAddress?: string;
  ethAddress?: string;
  sourceChain?: string;
  destinationChain?: string;
};

function validateParams({ availAddress, ethAddress }: TransactionQueryParams) {
  if (!availAddress && !ethAddress) {
    Logger.info("Either availAddress or ethAddress must be provided.");
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
async function fetchTransactions(
  userAddress: string,
  sourceChain?: string,
  destinationChain?: string,
): Promise<Transaction[]> {
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
    throw e; // Re-throw to propagate error to store
  }
}

const fetchWithErrorHandling = async (
  address: string,
  source: Chain,
  dest?: Chain,
) => {
  try {
    return await fetchTransactions(address, source, dest);
  } catch (error) {
    Logger.error(
      `Failed to fetch transactions for ${address} from ${source} to ${dest}: ${error}`,
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
  sourceChain,
  destinationChain,
}: TransactionQueryParams): Promise<Transaction[]> => {
  validateParams({ availAddress, ethAddress });

  const seenHashes = new Set<string>();

  const fetchPromises: Promise<Transaction[]>[] = [];

  if (ethAddress) {
    fetchPromises.push(
      fetchWithErrorHandling(ethAddress, Chain.ETH, Chain.AVAIL),
      fetchWithErrorHandling(ethAddress, Chain.AVAIL, Chain.ETH),
      fetchWormholeTransactions(false, ethAddress as `0x${string}`).catch(
        (err) => {
          Logger.error(`Failed to fetch Wormhole transactions: ${err}`);
          return [];
        },
      ),
      fetchAllLiquidityBridgeTransactions(
        false,
        ethAddress as `0x${string}`,
      ).catch((err) => {
        Logger.error(`Failed to fetch Liquidity Bridge transactions: ${err}`);
        return [];
      }),
    );
  }

  if (availAddress) {
    fetchPromises.push(
      fetchWithErrorHandling(availAddress, Chain.AVAIL, Chain.ETH),
      fetchWithErrorHandling(availAddress, Chain.ETH, Chain.AVAIL),
      fetchAllLiquidityBridgeTransactions(
        false,
        availAddress as `0x${string}`,
      ).catch((err) => {
        Logger.error(
          `Failed to fetch Liquidity Bridge transactions for Avail: ${err}`,
        );
        return [];
      }),
    );
  }

  const results = await Promise.allSettled(fetchPromises);
  const successfulResults = results
    .filter(
      (result): result is PromiseFulfilledResult<Transaction[]> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  // If all fetches failed, throw error to be caught by store
  if (successfulResults.length === 0 && results.length > 0) {
    throw new Error("All transaction fetches failed");
  }

  const allTransactions: Transaction[] = successfulResults.flat();

  return allTransactions.filter((txn) => {
    if (!seenHashes.has(txn.sourceTransactionHash)) {
      seenHashes.add(txn.sourceTransactionHash);
      return true;
    }
    return false;
  });
};
