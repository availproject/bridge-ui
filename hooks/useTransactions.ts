/* eslint-disable react-hooks/exhaustive-deps */
import { useTransactionsStore } from "@/stores/transactions";
import { Chain, TransactionStatus } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { useEffect, useMemo } from "react";
import { useAvailAccount } from "@/stores/availwallet";
import { useAccount } from "wagmi";
import { uniqBy } from 'lodash';

/**
 * @description All the functionalities related managing transactions
 */

export default function useTransactions() {
  const {
    indexedTransactions,
    localTransactions,
    addLocalTransaction,
  } = useTransactionsStore();

  const { selected } = useAvailAccount()
  const { address } = useAccount()
  const { transactionLoader } = useTransactionsStore()


  useEffect(() => {
    if (!selected?.address && !address) {
      return
    }

    (async () => {
      const _localtxns = (await JSON.parse(
        localStorage.getItem(`localTransactions:${selected?.address}`) || "[]",
      )) as Transaction[];
      localTransactions.push(..._localtxns);
    })();
  }, [selected?.address]);

  // allTransactions = indexedTransactions + localTransactions
  const allTransactions: Transaction[] = useMemo(() => {
    if (transactionLoader) {
      return [];
    }

    const normalizeHash = (hash: string) => hash.toLowerCase();
    const transactionsMatch = (tx1: Transaction, tx2: Transaction) => 
      normalizeHash(tx1.sourceTransactionHash) === normalizeHash(tx2.sourceTransactionHash);
  
    indexedTransactions.forEach(indexedTx => {
      const matchingLocalTx = localTransactions.find(localTx => 
        localTx.status === TransactionStatus.CLAIM_PENDING &&
        indexedTx.status === TransactionStatus.READY_TO_CLAIM &&
        transactionsMatch(localTx, indexedTx)
      );
  
      if (matchingLocalTx) {
        indexedTx.status = TransactionStatus.CLAIM_PENDING;
      }
    });
  
    const indexedTxMap = new Map(
      indexedTransactions.map(tx => [normalizeHash(tx.sourceTransactionHash), tx])
    );
  
    const uniqueLocalTransactions = localTransactions.filter(localTx => {
      if (localTx.status === TransactionStatus.CLAIM_PENDING) {
        return false;
      }
  
      const indexedTx = indexedTxMap.get(normalizeHash(localTx.sourceTransactionHash));
      
      // Only include if:
      // 1. No matching indexed transaction exists
      // 2. For ETH/AVAIL chains, check additional matching criteria
      return !indexedTx || (
        indexedTx.sourceChain !== Chain.ETH && 
        indexedTx.sourceChain !== Chain.AVAIL
      );
    });
  
    return [...uniqueLocalTransactions, ...indexedTransactions];
  }, [localTransactions, indexedTransactions]);

  const pendingTransactions: Transaction[] = useMemo(() => {
    return allTransactions && uniqBy(allTransactions, 'sourceTransactionHash').filter((txn) => txn.status !== "CLAIMED");
  }, [allTransactions]);

  const CHUNK_SIZE = 4;

  const paginatedPendingTransactions: Transaction[][] = useMemo(() => {
      const chunks = [];
      const sortedTxns = pendingTransactions.sort((a, b) => {
        return (
          new Date(b.sourceTimestamp).getTime() -
          new Date(a.sourceTimestamp).getTime()
        );
      });
      for (let i = 0; i < pendingTransactions.length; i += CHUNK_SIZE) {
        chunks.push(sortedTxns.slice(i, i + CHUNK_SIZE));
      }
      return chunks;
  }, [pendingTransactions]);

  const completedTransactions: Transaction[] = useMemo(() => {
    return allTransactions.filter((txn ) => txn.status === "CLAIMED");
  }, [allTransactions]);

  const paginatedCompletedTransactions: Transaction[][] = useMemo(() => {
    const chunks = [];
    const sortedTxns = completedTransactions.sort((a, b) => {
      return (
        new Date(b.sourceTimestamp).getTime() -
        new Date(a.sourceTimestamp).getTime()
      );
    });
    for (let i = 0; i < completedTransactions.length; i += CHUNK_SIZE) {
      chunks.push(sortedTxns.slice(i, i + CHUNK_SIZE));
    }
    return chunks
  },[completedTransactions]);



  const addToLocalTransaction = (transaction: Transaction) => {
    const localTransactionsKey = `localTransactions:${selected?.address}`;
    const existingTransactions = JSON.parse(localStorage.getItem(localTransactionsKey) || '[]');
   
    const transactionExists = existingTransactions.some(
      (t: Transaction) => t.sourceTransactionHash === transaction.sourceTransactionHash
    );
      if (!transactionExists) {
      const updatedTransactions = [...existingTransactions, transaction];
      localStorage.setItem(localTransactionsKey, JSON.stringify(updatedTransactions));
    }
    addLocalTransaction(transaction);
  };

  const deleteLocalTransaction = (transaction: Transaction) => {
    deleteLocalTransaction(transaction)
    updateLocalStorageTransactions(localTransactions);
  }

  const updateLocalStorageTransactions = (transactions: Transaction[]) => {
    localStorage.setItem(`localTransactions:${selected?.address}`, JSON.stringify(transactions));
  }

  return {
    allTransactions,
    pendingTransactions,
    completedTransactions,
    paginatedPendingTransactions,
    paginatedCompletedTransactions,
    addToLocalTransaction,
  };
}
