import { Transaction } from "@/types/transaction";
import { create } from "zustand";

interface TransactionsStore {
  indexedTransactions: Transaction[];
  setIndexedTransactions: (transactions: Transaction[]) => void;
  localTransactions: Transaction[];
  addLocalTransaction: (transaction: Transaction) => void;
  deleteLocalTransaction: (sourceTransactionHash: `0x${string}`) => void;
}

export const useTransactionsStore = create<TransactionsStore>((set) => ({
  indexedTransactions: [],
  setIndexedTransactions: (indexedTransactions) => set({ indexedTransactions }),
  localTransactions: [],
  addLocalTransaction: (localTransaction) =>
    set(state => ({ localTransactions: [...state.localTransactions, localTransaction] })),
  deleteLocalTransaction: (sourceTransactionHash: `0x${string}`) => {
    set(state => ({
      localTransactions: state.localTransactions.filter(
        (txn) => txn.sourceTransactionHash !== sourceTransactionHash
      )
    }))
  }
}));
