/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Flow:
 * 1. Check for pendingIndexedTransactions from store
 * 2. Process pending transactions with localStorage transactions
 * 3. Merge with proper status precedence
 * 4. Update both indexedTransactions and mergedTransactions atomically
 * 5. Clear pendingIndexedTransactions after processing
 */

import { useTransactionsStore } from "@/stores/transactions";
import { Chain, TransactionStatus } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAvailAccount } from "@/stores/availwallet";
import { useAccount } from "wagmi";
import { uniqBy } from "lodash";

export default function useTransactions() {
  const {
    indexedTransactions,
    pendingIndexedTransactions,
    setPendingIndexedTransactions,
    setIndexedTransactions,
    localTransactions,
    addLocalTransaction,
    deleteLocalTransaction,
    transactionLoader,
    fetchError,
    isInitialLoad,
  } = useTransactionsStore();

  const { selected } = useAvailAccount();
  const { address } = useAccount();
  const [mergedTransactions, setMergedTransactions] = useState<Transaction[]>(
    [],
  );
  const processingRef = useRef(false);

  useEffect(() => {
    if (!selected?.address && !address) {
      return;
    }

    const loadLocalTransactions = async () => {
      const accountAddress = selected?.address || address;
      const storageKey = `localTransactions:${accountAddress}`;
      const storedTxns = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      ) as Transaction[];

      localTransactions.length = 0;
      localTransactions.push(...storedTxns);
    };

    loadLocalTransactions();
  }, [selected?.address, address]);

  useEffect(() => {
    if (processingRef.current) return;
    if (!selected?.address && !address) return;

    // Process pending transactions if available, otherwise use current indexed
    const transactionsToProcess =
      pendingIndexedTransactions !== null
        ? pendingIndexedTransactions
        : indexedTransactions;

    // Only process if we have pending transactions or it's the first render with indexed transactions
    if (
      pendingIndexedTransactions === null &&
      mergedTransactions.length > 0 &&
      indexedTransactions === transactionsToProcess
    ) {
      return;
    }

    processingRef.current = true;

    const mergeTransactions = async () => {
      const accountAddress = selected?.address || address;
      const storageKey = `localTransactions:${accountAddress}`;

      const normalizeHash = (hash?: string) => hash?.toLowerCase() ?? "";

      const indexedTxMap = new Map<string, Transaction>();
      transactionsToProcess.forEach((tx) => {
        indexedTxMap.set(normalizeHash(tx.sourceTransactionHash), tx);
      });

      const localTxnsToDelete: string[] = [];
      const processedLocalTxns: Transaction[] = [];
      const processedIndexedTxns = [...transactionsToProcess];

      localTransactions.forEach((localTx) => {
        const normalizedLocalHash = normalizeHash(
          localTx.sourceTransactionHash,
        );
        const matchingIndexedTx = indexedTxMap.get(normalizedLocalHash);

        if (!matchingIndexedTx) {
          processedLocalTxns.push(localTx);
          return;
        }

        if (
          localTx.status === TransactionStatus.INITIATED &&
          matchingIndexedTx.status === TransactionStatus.PENDING
        ) {
          localTxnsToDelete.push(localTx.sourceTransactionHash);
        } else if (localTx.status === TransactionStatus.CLAIM_PENDING) {
          if (matchingIndexedTx.status === TransactionStatus.READY_TO_CLAIM) {
            const indexedTxIndex = processedIndexedTxns.findIndex(
              (tx) =>
                normalizeHash(tx.sourceTransactionHash) === normalizedLocalHash,
            );
            if (indexedTxIndex !== -1) {
              processedIndexedTxns[indexedTxIndex] = {
                ...processedIndexedTxns[indexedTxIndex],
                status: TransactionStatus.CLAIM_PENDING,
              };
            }
          } else if (matchingIndexedTx.status === TransactionStatus.CLAIMED) {
            localTxnsToDelete.push(localTx.sourceTransactionHash);
          }
        } else if (
          matchingIndexedTx.sourceChain === Chain.ETH ||
          matchingIndexedTx.sourceChain === Chain.AVAIL
        ) {
          localTxnsToDelete.push(localTx.sourceTransactionHash);
        } else {
          processedLocalTxns.push(localTx);
        }
      });

      if (localTxnsToDelete.length > 0 && accountAddress) {
        const remainingLocalTxns = localTransactions.filter(
          (tx) => !localTxnsToDelete.includes(tx.sourceTransactionHash),
        );
        localStorage.setItem(storageKey, JSON.stringify(remainingLocalTxns));

        localTxnsToDelete.forEach((hash) => {
          deleteLocalTransaction(hash as `0x${string}`);
        });
      }

      const allTxns = [...processedLocalTxns, ...processedIndexedTxns];
      const uniqueTxns = uniqBy(allTxns, "sourceTransactionHash");

      // Update everything atomically
      if (pendingIndexedTransactions !== null) {
        setIndexedTransactions(transactionsToProcess);
        setPendingIndexedTransactions(null);
      }

      setMergedTransactions(uniqueTxns);
      processingRef.current = false;
    };

    mergeTransactions();
  }, [
    pendingIndexedTransactions,
    indexedTransactions,
    localTransactions,
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

  const addToLocalTransaction = (transaction: Transaction) => {
    const accountAddress = selected?.address || address;
    const localTransactionsKey = `localTransactions:${accountAddress}`;
    const existingTransactions = JSON.parse(
      localStorage.getItem(localTransactionsKey) || "[]",
    );

    const transactionExists = existingTransactions.some(
      (t: Transaction) =>
        t.sourceTransactionHash === transaction.sourceTransactionHash,
    );

    if (!transactionExists) {
      const updatedTransactions = [...existingTransactions, transaction];
      localStorage.setItem(
        localTransactionsKey,
        JSON.stringify(updatedTransactions),
      );
      addLocalTransaction(transaction);
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
