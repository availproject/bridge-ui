/**
 * Flow:
 * 1. Start/stop polling based on account
 * 2. Get transactions from store (already deduplicated)
 * 3. Filter, sort, and paginate for UI display
 * 4. Auto-refresh every 20 seconds via polling
 */

import { useTransactionsStore } from "@/stores/transactions";
import { TransactionStatus } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { useEffect, useMemo } from "react";
import { useAvailAccount } from "@/stores/availwallet";
import { useAccount } from "wagmi";
import { markTransactionInitiated } from "@/services/transactions";
import { Logger } from "@/utils/logger";

export default function useTransactions() {
  const {
    indexedTransactions,
    pendingIndexedTransactions,
    setIndexedTransactions,
    setPendingIndexedTransactions,
    startPolling,
    stopPolling,
  } = useTransactionsStore();

  const { selected } = useAvailAccount();
  const { address } = useAccount();

  useEffect(() => {
    const accountAddress = selected?.address || address;

    if (!accountAddress) {
      stopPolling();
      return;
    }

    startPolling({
      ethAddress: address,
      availAddress: selected?.address,
    });

    return () => {
      stopPolling();
    };
  }, [selected?.address, address, startPolling, stopPolling]);

  useEffect(() => {
    if (pendingIndexedTransactions !== null) {
      setIndexedTransactions(pendingIndexedTransactions);
      setPendingIndexedTransactions(null);
    }
  }, [pendingIndexedTransactions, setIndexedTransactions, setPendingIndexedTransactions]);

  const pendingTransactions: Transaction[] = useMemo(() => {
    return indexedTransactions
      .filter((txn) => txn.status !== TransactionStatus.CLAIMED)
      .sort(
        (a, b) =>
          new Date(b.sourceTimestamp).getTime() -
          new Date(a.sourceTimestamp).getTime(),
      );
  }, [indexedTransactions]);

  const completedTransactions: Transaction[] = useMemo(() => {
    return indexedTransactions
      .filter((txn) => txn.status === TransactionStatus.CLAIMED)
      .sort(
        (a, b) =>
          new Date(b.sourceTimestamp).getTime() -
          new Date(a.sourceTimestamp).getTime(),
      );
  }, [indexedTransactions]);

  const CHUNK_SIZE = 4;

  const paginatedPendingTransactions: Transaction[][] = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < pendingTransactions.length; i += CHUNK_SIZE) {
      chunks.push(pendingTransactions.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
  }, [pendingTransactions]);

  const paginatedCompletedTransactions: Transaction[][] = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < completedTransactions.length; i += CHUNK_SIZE) {
      chunks.push(completedTransactions.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
  }, [completedTransactions]);

  const addToLocalTransaction = async (transaction: Transaction) => {
    try {
      await markTransactionInitiated(transaction.sourceTransactionHash);
    } catch (error) {
      Logger.error(`Failed to mark transaction as initiated: ${error}`);
    }
  };

  return {
    allTransactions: indexedTransactions,
    pendingTransactions,
    completedTransactions,
    paginatedPendingTransactions,
    paginatedCompletedTransactions,
    addToLocalTransaction,
  };
}
