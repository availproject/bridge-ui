import axios from "axios";
import { appConfig } from "@/config/default";
import { Transaction } from "@/types/transaction";
import { Chain } from "@/types/common";
import { Logger } from "@/utils/logger";
import { fetchWormholeTransactions } from "@/hooks/wormhole/helper";
import { fetchAllLiquidityBridgeTransactions } from "./bridgeapi";

const bridgeApiInstance = axios.create({
  baseURL: appConfig.bridgeApiBaseUrl,
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

export const markTransactionInitiated = async (
  txHash: string,
): Promise<void> => {
  try {
    await bridgeApiInstance.post(`/v2/transaction/${txHash}`);
    Logger.info(`Transaction ${txHash} marked as initiated`);
  } catch (e: any) {
    Logger.error(`ERROR_MARKING_TRANSACTION_INITIATED: ${e}`);
    throw e;
  }
};

async function fetchBridgeApiTransactions(
  ethAddress?: string,
  availAddress?: string,
): Promise<Transaction[]> {
  try {
    const params: Record<string, string> = {};
    if (ethAddress) params.ethAddress = ethAddress;
    if (availAddress) params.availAddress = availAddress;

    if (!ethAddress && !availAddress) {
      return [];
    }

    const response = await bridgeApiInstance.get(`/transactions`, {
      params,
    });

    const apiTransactions = response.data || [];

    // Map API response to Transaction type
    return apiTransactions.map((tx: any) => {
      // Parse direction to get source and destination chains
      const isEthToAvail = tx.direction === "EthAvail";
      const sourceChain = isEthToAvail ? Chain.ETH : Chain.AVAIL;
      const destinationChain = isEthToAvail ? Chain.AVAIL : Chain.ETH;

      // Map status from API to TransactionStatus enum
      let status;
      switch (tx.status) {
        case "ClaimReady":
          status = "READY_TO_CLAIM";
          break;
        case "Bridged":
          status = "CLAIMED";
          break;
        case "Pending":
          status = "PENDING";
          break;
        default:
          status = tx.status;
      }

      return {
        sourceTransactionHash: tx.sourceTxHash,
        depositorAddress: tx.sender,
        receiverAddress: tx.receiver,
        sourceChain,
        destinationChain,
        status,
        amount: tx.amount,
        sourceBlockHash: tx.sourceBlockHash,
        messageId: tx.messageId ? Number(tx.messageId) : undefined,
        destinationTransactionBlockNumber: tx.destinationBlockNumber,
        destinationTransactionIndex: tx.destinationTxIndex,
        // TODO: Bridge API doesn't provide sourceTimestamp (created_at/timestamp field).
        // This causes issues with:
        // 1. Transaction sorting - all transactions appear to have the same time
        // 2. UI display - shows "just now" for all transactions instead of actual time
        // Solution: Request API team to add timestamp fields or fetch from blockchain
        sourceTimestamp: new Date().toISOString(),
      };
    });
  } catch (e: any) {
    Logger.error(`ERROR_FETCHING_BRIDGE_API_TRANSACTIONS: ${e}`);
    return [];
  }
}

export const getAllTransactions = async ({
  availAddress,
  ethAddress,
  sourceChain,
  destinationChain,
}: TransactionQueryParams): Promise<Transaction[]> => {
  validateParams({ availAddress, ethAddress });

  const seenHashes = new Set<string>();

  const fetchPromises: Promise<Transaction[]>[] = [];

  if (ethAddress || availAddress) {
    fetchPromises.push(
      fetchBridgeApiTransactions(ethAddress, availAddress).catch((err) => {
        Logger.error(`Failed to fetch Bridge API transactions: ${err}`);
        return [];
      })
    );
  }

  if (ethAddress) {
    fetchPromises.push(
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
