import { Transaction } from "@/types/transaction";
import { create } from "zustand";

export type BasicTransaction = Pick<Transaction, 
  'sourceTransactionHash' | 
  'sourceTimestamp' | 
  'amount' | 
  'destinationTransactionHash'
>;

interface TransactionsStore {
  transactionLoader: boolean;
  setTransactionLoader: (transactionLoader: boolean) => void;
  indexedTransactions: Transaction[];
  setIndexedTransactions: (transactions: Transaction[]) => void;
  localTransactions: Array<Partial<Transaction>>;
  addLocalTransaction: (transaction: Partial<Transaction> & BasicTransaction) => void;
  deleteLocalTransaction: (sourceTransactionHash: `0x${string}`) => void;
  pendingTransactionsNumber: number;
  setPendingTransactionsNumber: (pendingTransactions: number) => void;
  readyToClaimTransactionsNumber: number;
  setReadyToClaimTransactionsNumber: (readyToClaimTransactions: number) => void;
}

export const useTransactionsStore = create<TransactionsStore>((set) => ({
  transactionLoader: false,
  setTransactionLoader: (transactionLoader) => set({ transactionLoader }),
  indexedTransactions: [],
  setIndexedTransactions: (indexedTransactions) => set({ indexedTransactions }),
  localTransactions: [],
  addLocalTransaction: (localTransaction) =>
    set(state => ({ localTransactions: [...state.localTransactions, localTransaction] })),
  deleteLocalTransaction: (sourceTransactionHash) => 
    set(state => ({
      localTransactions: state.localTransactions.filter(
        (txn) => txn.sourceTransactionHash !== sourceTransactionHash
      )
    })),
  pendingTransactionsNumber: 0,
  setPendingTransactionsNumber: (pendingTransactionsNumber) => set({ pendingTransactionsNumber }),
  readyToClaimTransactionsNumber: 0,
  setReadyToClaimTransactionsNumber: (readyToClaimTransactionsNumber) => set({ readyToClaimTransactionsNumber }),
}));