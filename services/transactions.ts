import axios from "axios";
import { appConfig } from "@/config/default";
import { Transaction } from "@/types/transaction";
import { Chain, TransactionStatus } from "@/types/common";
import { Logger } from "@/utils/logger";
import { fetchWormholeTransactions } from "@/hooks/wormhole/helper";
import { fetchAllLiquidityBridgeTransactions } from "./bridgeapi";

const bridgeApiInstance = axios.create({
  baseURL: appConfig.bridgeApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

type TransactionQueryParams = {
  availAddress?: string;
  ethAddress?: string;
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
          status = TransactionStatus.READY_TO_CLAIM;
          break;
        case "Bridged":
          status = TransactionStatus.CLAIMED;
          break;
        case "Pending":
          status = TransactionStatus.PENDING;
          break;
        default:
          status = TransactionStatus.PENDING;
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
        sourceBlockNumber: tx.sourceBlockNumber,
        sourceTransactionIndex: tx.sourceTxIndex,
        messageId: tx.messageId ? Number(tx.messageId) : undefined,
        destinationTransactionBlockNumber: tx.destinationBlockNumber,
        destinationTransactionIndex: tx.destinationTxIndex,
        timeRemaining: tx.claimEstimate,
        sourceTimestamp: tx.timestamp
          ? new Date(tx.timestamp).getTime()
          : 0,
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
}: TransactionQueryParams): Promise<Transaction[]> => {

  const seenHashes = new Set<string>();

  const fetchPromises: Promise<Transaction[]>[] = [];

  if (ethAddress || availAddress) {
    fetchPromises.push(
      fetchBridgeApiTransactions(ethAddress, availAddress).catch((err) => {
        Logger.error(`Failed to fetch Bridge API transactions: ${err}`);
        return [];
      }),
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
