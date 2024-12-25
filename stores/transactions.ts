import { getTransactionsFromIndexer } from "@/services/transactions";
import { Transaction } from "@/types/transaction";
import { create } from "zustand";
type ClickHandler<T> = (value: T) => void;

interface TransactionsStore {
  transactionLoader: boolean;
  setTransactionLoader: (transactionLoader: boolean) => void;
  indexedTransactions: Transaction[];
  setIndexedTransactions: (transactions: Transaction[]) => void;
  fetchIndexedTransactions: ({
    ethAddress,
    availAddress,
    setTransactionLoader,
  }: FetchTxnParams) => Promise<void>;
  localTransactions: Transaction[];
  addLocalTransaction: (transaction: Transaction) => void;
  deleteLocalTransaction: (sourceTransactionHash: `0x${string}`) => void;
  pendingTransactionsNumber: number;
  setPendingTransactionsNumber: (pendingTransactions: number) => void;
  readyToClaimTransactionsNumber: number;
  setReadyToClaimTransactionsNumber: (readyToClaimTransactions: number) => void;
}

type FetchTxnParams = {
  ethAddress?: string | undefined;
  availAddress?: string | undefined;
  setTransactionLoader: ClickHandler<boolean>;
};

export const useTransactionsStore = create<TransactionsStore>((set) => ({
  transactionLoader: false,
  setTransactionLoader: (transactionLoader) => set({ transactionLoader }),
  indexedTransactions: [],
  setIndexedTransactions: (indexedTransactions) => set({ indexedTransactions }),
  fetchIndexedTransactions: async ({
    ethAddress,
    availAddress,
    setTransactionLoader,
  }: FetchTxnParams) => {
    if (!ethAddress && !availAddress) {
      return;
    }

    setTransactionLoader(true);
    const indexedTxns = await getTransactionsFromIndexer({
      availAddress,
      ethAddress,
    });
    set({ indexedTransactions: indexedTxns });
    setTransactionLoader(false);
  },
  localTransactions: [],
  addLocalTransaction: (localTransaction) =>
    set((state) => ({
      localTransactions: [...state.localTransactions, localTransaction],
    })),
  deleteLocalTransaction: (sourceTransactionHash: `0x${string}`) => {
    set((state) => ({
      localTransactions: state.localTransactions.filter(
        (txn) => txn.sourceTransactionHash !== sourceTransactionHash
      ),
    }));
  },
  pendingTransactionsNumber: 0,
  setPendingTransactionsNumber: (pendingTransactionsNumber) =>
    set({ pendingTransactionsNumber }),
  readyToClaimTransactionsNumber: 0,
  setReadyToClaimTransactionsNumber: (readyToClaimTransactionsNumber) =>
    set({ readyToClaimTransactionsNumber }),
}));
