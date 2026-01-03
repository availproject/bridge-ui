/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Flow:
 * 1. Fetch transactions from bridge API and other sources (Wormhole, Liquidity Bridge)
 * 2. Deduplicate and sort transactions
 * 3. Auto-refresh every 20 seconds
 */

import { useTransactionsStore } from "@/stores/transactions";
import { TransactionStatus } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAvailAccount } from "@/stores/availwallet";
import { useAccount } from "wagmi";
import { uniqBy } from "lodash";
import { markTransactionInitiated } from "@/services/transactions";
import { Logger } from "@/utils/logger";

export default function useTransactions() {
  const {
    indexedTransactions,
    pendingIndexedTransactions,
    setPendingIndexedTransactions,
    setIndexedTransactions,
    transactionLoader,
    fetchError,
    isInitialLoad,
    startPolling,
    stopPolling,
  } = useTransactionsStore();

  const { selected } = useAvailAccount();
  const { address } = useAccount();
  const [mergedTransactions, setMergedTransactions] = useState<Transaction[]>(
    [],
  );
  const processingRef = useRef(false);

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
  }, [selected?.address, address]);

  useEffect(() => {
    if (processingRef.current) return;
    if (!selected?.address && !address) return;

    const transactionsToProcess =
      pendingIndexedTransactions !== null
        ? pendingIndexedTransactions
        : indexedTransactions;

    if (
      pendingIndexedTransactions === null &&
      mergedTransactions.length > 0 &&
      indexedTransactions === transactionsToProcess
    ) {
      return;
    }

    processingRef.current = true;

    const processTransactions = async () => {
      const uniqueTxns = uniqBy(transactionsToProcess, "sourceTransactionHash");

      if (pendingIndexedTransactions !== null) {
        setIndexedTransactions(transactionsToProcess);
        setPendingIndexedTransactions(null);
      }

      setMergedTransactions(uniqueTxns);
      processingRef.current = false;
    };

    processTransactions();
  }, [
    pendingIndexedTransactions,
    indexedTransactions,
    selected?.address,
    address,
  ]);

  const pendingTransactions: Transaction[] = useMemo(() => {
    return mergedTransactions
      .filter((txn) => txn.status !== TransactionStatus.CLAIMED)
      .sort(
        (a, b) =>
          new Date(b.sourceTimestamp).getTime() -
          new Date(a.sourceTimestamp).getTime(),
      );
  }, [mergedTransactions]);

  const completedTransactions: Transaction[] = useMemo(() => {
    return mergedTransactions
      .filter((txn) => txn.status === TransactionStatus.CLAIMED)
      .sort(
        (a, b) =>
          new Date(b.sourceTimestamp).getTime() -
          new Date(a.sourceTimestamp).getTime(),
      );
  }, [mergedTransactions]);

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
    allTransactions: mergedTransactions,
    pendingTransactions,
    completedTransactions,
    paginatedPendingTransactions,
    paginatedCompletedTransactions,
    addToLocalTransaction,
  };
}
