/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Flow:
 * 1. Fetch indexed transactions from multiple sources
 * 2. Load localStorage transactions for current account
 * 3. Merge transactions with proper status precedence:
 *    - initiated (local) < in_progress (indexer) → use indexer, delete local
 *    - claim_pending (local) > ready_to_claim (indexer) → keep local until bridged
 * 4. Deduplicate and sort transactions
 * 5. Update UI atomically after all mutations complete
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

  // Load localStorage transactions on account change
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

      // Update local state without triggering re-render until merge is complete
      localTransactions.length = 0;
      localTransactions.push(...storedTxns);
    };

    loadLocalTransactions();
  }, [selected?.address, address]);

  // Merge and process transactions when either source updates
  useEffect(() => {
    if (processingRef.current) return;
    if (transactionLoader && isInitialLoad) return; // Wait for initial load to complete

    processingRef.current = true;

    const mergeTransactions = async () => {
      const accountAddress = selected?.address || address;
      const storageKey = `localTransactions:${accountAddress}`;
      const normalizeHash = (hash?: string) => hash?.toLowerCase() ?? "";

      // Create map of indexed transactions for O(1) lookup
      const indexedTxMap = new Map<string, Transaction>();
      indexedTransactions.forEach((tx) => {
        indexedTxMap.set(normalizeHash(tx.sourceTransactionHash), tx);
      });

      // Process local transactions and determine which to keep/delete
      const localTxnsToDelete: string[] = [];
      const processedLocalTxns: Transaction[] = [];
      const processedIndexedTxns = [...indexedTransactions];

      localTransactions.forEach((localTx) => {
        const normalizedLocalHash = normalizeHash(
          localTx.sourceTransactionHash,
        );
        const matchingIndexedTx = indexedTxMap.get(normalizedLocalHash);

        if (!matchingIndexedTx) {
          // No matching indexed transaction, keep local
          processedLocalTxns.push(localTx);
          return;
        }

        // Handle status precedence
        if (
          localTx.status === TransactionStatus.INITIATED &&
          matchingIndexedTx.status === TransactionStatus.PENDING
        ) {
          // Use indexer version, mark local for deletion
          localTxnsToDelete.push(localTx.sourceTransactionHash);
        } else if (localTx.status === TransactionStatus.CLAIM_PENDING) {
          if (matchingIndexedTx.status === TransactionStatus.READY_TO_CLAIM) {
            // Keep local claim_pending status over ready_to_claim
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
            // Transaction completed, delete local version
            localTxnsToDelete.push(localTx.sourceTransactionHash);
          }
        } else if (
          matchingIndexedTx.sourceChain === Chain.ETH ||
          matchingIndexedTx.sourceChain === Chain.AVAIL
        ) {
          // For ETH/AVAIL chains, prefer indexed version
          localTxnsToDelete.push(localTx.sourceTransactionHash);
        } else {
          // Keep local transaction
          processedLocalTxns.push(localTx);
        }
      });

      // Clean up localStorage
      if (localTxnsToDelete.length > 0 && accountAddress) {
        const remainingLocalTxns = localTransactions.filter(
          (tx) => !localTxnsToDelete.includes(tx.sourceTransactionHash),
        );
        localStorage.setItem(storageKey, JSON.stringify(remainingLocalTxns));

        // Update store
        localTxnsToDelete.forEach((hash) => {
          deleteLocalTransaction(hash as `0x${string}`);
        });
      }

      // Merge all transactions and remove duplicates
      const allTxns = [...processedLocalTxns, ...processedIndexedTxns];
      const uniqueTxns = uniqBy(allTxns, "sourceTransactionHash");

      // Update merged transactions state atomically
      setMergedTransactions(uniqueTxns);
      processingRef.current = false;
    };

    mergeTransactions();
  }, [
    indexedTransactions,
    localTransactions,
    transactionLoader,
    isInitialLoad,
  ]);

  // Filter and sort transactions
  const pendingTransactions: Transaction[] = useMemo(() => {
    if (fetchError) return [];
    return mergedTransactions
      .filter((txn) => txn.status !== TransactionStatus.CLAIMED)
      .sort(
        (a, b) =>
          new Date(b.sourceTimestamp).getTime() -
          new Date(a.sourceTimestamp).getTime(),
      );
  }, [mergedTransactions, fetchError]);

  const completedTransactions: Transaction[] = useMemo(() => {
    if (fetchError) return [];
    return mergedTransactions
      .filter((txn) => txn.status === TransactionStatus.CLAIMED)
      .sort(
        (a, b) =>
          new Date(b.sourceTimestamp).getTime() -
          new Date(a.sourceTimestamp).getTime(),
      );
  }, [mergedTransactions, fetchError]);

  // Paginate transactions
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

  // Helper functions
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
