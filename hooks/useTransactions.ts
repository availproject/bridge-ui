/* eslint-disable react-hooks/exhaustive-deps */
import { getTransactionsFromIndexer } from "@/services/transactions";
import { useTransactionsStore } from "@/stores/transactionsStore";
import { Chain } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { useEffect, useMemo } from "react";

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

  useEffect(() => {
    (async () => {
      const _localtxns = (await JSON.parse( 
        localStorage.getItem("localTransactions") || "[]" )) as Transaction[];
        console.log(_localtxns, "local txns from local storage")
        localTransactions.push(..._localtxns);      
    })();
  }, []);


  // Fetch transactions from indexer
  const fetchTransactions = async ({
    userAddress,
    sourceChain,
    destinationChain,
  }: {
    userAddress: string;
    sourceChain: string;
    destinationChain: string;
  }) => {
    // Fetch all transactions
    const indexedTransactions = await getTransactionsFromIndexer(
      userAddress,
      sourceChain,
      destinationChain
    );
    setIndexedTransactions(indexedTransactions);
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
console.log(localTransactions, "local txns this it it")
    localTransactions.forEach((localTxn) => {
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
      const isUniqueTxn = !allTransactions.some((txn) => 
        txn.sourceTransactionHash.toLowerCase() === localTxn.sourceTransactionHash.toLowerCase()
    );
      if (!indexedTxn && isUniqueTxn) { 
        allTransactions.push(localTxn);
      } else {
        // 
        // localStorage.removeItem("localTransactions");
      }
    });

    allTransactions.push(...indexedTransactions);

    return allTransactions;
  }, [indexedTransactions, localTransactions]);

  const pendingTransactions: Transaction[] = useMemo(() => {
    return allTransactions.filter((txn) => txn.status !== "CLAIMED");
  }, [allTransactions]);

  const completedTransactions: Transaction[] = useMemo(() => {
    return allTransactions.filter((txn) => txn.status === "CLAIMED");
  }, [allTransactions]);

  const addToLocalTransaction = (transaction: Transaction) => {
    addLocalTransaction(transaction);
    localStorage.setItem(
      "localTransactions",
      JSON.stringify([
        ...JSON.parse(localStorage.getItem("localTransactions") || "[]"),
        transaction,
      ])
    );
    console.log(localStorage.getItem("localTransactions"), "add specific txn to local storage ");
  };

  return {
    allTransactions,
    pendingTransactions,
    completedTransactions,
    fetchTransactions,  
    addToLocalTransaction,
  };
}
