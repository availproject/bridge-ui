/* eslint-disable react-hooks/exhaustive-deps */
import { getTransactionsFromIndexer } from "@/services/transactions";
import { useTransactionsStore } from "@/stores/transactionsStore";
import { Chain, TransactionStatus } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { useEffect, useMemo } from "react";
import { useAvailAccount } from "@/stores/availWalletHook";
import { useAccount } from "wagmi";
import { pollWithDelay } from "@/utils/poller";

/**
 * @description All the functionalities related to substrate wallet such as connecting, switching network, etc
 */
export default function useTransactions() {
  const {
    indexedTransactions,
    localTransactions,
    setIndexedTransactions,
    addLocalTransaction,
  } = useTransactionsStore();

  const { selected } = useAvailAccount()
  const { address } = useAccount()
  const { setTransactionLoader, transactionLoader } = useTransactionsStore()

  useEffect(() => {
    if (!selected?.address && !address) {
      return
    }

    pollWithDelay(
      fetchTransactions,
      [
          {
              availAddress: selected?.address,
              ethAddress: address,
          }
      ],
      10,
  );
  }, []);

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

  // Fetch transactions from indexer
  const fetchTransactions = async ({
    availAddress,
    ethAddress,
    sourceChain,
    destinationChain,
  }: {
    availAddress?: string;
    ethAddress?: string;
    sourceChain?: Chain;
    destinationChain?: Chain;
  }) => {
    try{
    setTransactionLoader(true);
    const indexedTransactions = await getTransactionsFromIndexer(
     { availAddress: availAddress, ethAddress: ethAddress, sourceChain: sourceChain, destinationChain: destinationChain}
    );
    setIndexedTransactions(indexedTransactions);
    } catch (error) {} finally {
      setTransactionLoader(false);
    }
  };

  // allTransactions = indexedTransactions + localTransactions
  const allTransactions: Transaction[] = useMemo(() => {
    /**
     * Merge indexedTransactions and localTransactions
     * if local transaction is already indexed, delete it from localTransactions
     * else add it to allTransactions
     * but deleting will create circular dependency, hence leave it as it is
     */

    
    const allTransactions: Transaction[] = [];

    if (!transactionLoader)  {
      localTransactions.forEach((localTxn) => {
        if (localTxn.status === TransactionStatus.CLAIM_PENDING) {
          const pendingTxn = indexedTransactions.find((indexedTxn) => {
            if (indexedTxn.status === TransactionStatus.READY_TO_CLAIM) {
              return (
                indexedTxn.sourceTransactionHash.toLowerCase() ===
                localTxn.sourceTransactionHash.toLowerCase()
              );
            }
            return false;
          });
          const isUniqueTxn = !allTransactions.some(
            (txn) =>
              txn.sourceTransactionHash.toLowerCase() ===
              localTxn.sourceTransactionHash.toLowerCase(),
          );
  
          if (pendingTxn && isUniqueTxn) {
            indexedTransactions.find((txn) => {
              if (
                txn.sourceTransactionHash.toLowerCase() ===
                localTxn.sourceTransactionHash.toLowerCase()
              ) {
                txn.status = TransactionStatus.CLAIM_PENDING;
                return txn;
              }
            });
          }
        } else {
          const indexedTxn = indexedTransactions.find((indexedTxn) => {
            if (indexedTxn.sourceChain === Chain.ETH) {
              return (
                indexedTxn.sourceTransactionHash.toLowerCase() ===
                localTxn.sourceTransactionHash.toLowerCase()
              );
            } else if (indexedTxn?.sourceChain === Chain.AVAIL) {
              return (
                indexedTxn.sourceBlockHash.toLowerCase() ===
                localTxn.sourceBlockHash.toLowerCase()
              );
            }
          });
          const isUniqueTxn = !allTransactions.some(
            (txn) =>
              txn.sourceTransactionHash.toLowerCase() ===
              localTxn.sourceTransactionHash.toLowerCase(),
          );
          if (!indexedTxn && isUniqueTxn) {
            allTransactions.push(localTxn);
          }
        }
      });
  
      allTransactions.push(...indexedTransactions);
      return allTransactions;
    }

    return indexedTransactions;
  }, [indexedTransactions, localTransactions]);

  const pendingTransactions: Transaction[] = useMemo(() => {
    return allTransactions.filter((txn) => txn.status !== "CLAIMED");
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
    fetchTransactions,
    addToLocalTransaction,
  };
}
