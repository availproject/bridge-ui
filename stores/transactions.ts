/**
 * Flow:
 * 1. Fetch transactions from all sources and store in pendingIndexedTransactions
 * 2. Hook processes pending transactions
 * 3. Update indexedTransactions atomically
 * 4. Auto-polling refreshes transactions every 20 seconds
 */

import { getAllTransactions } from "@/services/transactions";
import { TransactionStatus } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { create } from "zustand";
type ClickHandler<T> = (value: T) => void;

interface TransactionsStore {
  /** inProcess -> added so we can stop refetching transactions if any claim is already in process (causes dep issues otherwise) */
  inProcess: boolean;
  setInProcess: ClickHandler<boolean>;
  transactionLoader: boolean;
  setTransactionLoader: (transactionLoader: boolean) => void;
  isInitialLoad: boolean;
  setIsInitialLoad: (isInitialLoad: boolean) => void;
  fetchError: boolean;
  setFetchError: (fetchError: boolean) => void;
  fetchCounter: number;
  pollingIntervalId: ReturnType<typeof setInterval> | null;
  startPolling: ({
    ethAddress,
    availAddress,
  }: {
    ethAddress?: string;
    availAddress?: string;
  }) => void;
  stopPolling: () => void;
  indexedTransactions: Transaction[];
  setIndexedTransactions: (transactions: Transaction[]) => void;
  pendingIndexedTransactions: Transaction[] | null;
  setPendingIndexedTransactions: (transactions: Transaction[] | null) => void;
  fetchAllTransactions: ({
    ethAddress,
    availAddress,
    setTransactionLoader,
    isInitialFetch,
  }: FetchTxnParams) => Promise<void>;
  pendingTransactionsNumber: number;
  setPendingTransactionsNumber: (pendingTransactions: number) => void;
  readyToClaimTransactionsNumber: number;
  setReadyToClaimTransactionsNumber: (readyToClaimTransactions: number) => void;
  transactionStatus: TransactionStatus;
  setTransactionStatus: (status: TransactionStatus) => void;
}

type FetchTxnParams = {
  ethAddress?: string | undefined;
  availAddress?: string | undefined;
  setTransactionLoader: ClickHandler<boolean>;
  isInitialFetch?: boolean;
};

export const useTransactionsStore = create<TransactionsStore>((set, get) => ({
  inProcess: false,
  setInProcess: (inProcess) => set({ inProcess }),
  transactionLoader: false,
  setTransactionLoader: (transactionLoader) => set({ transactionLoader }),
  isInitialLoad: true,
  setIsInitialLoad: (isInitialLoad) => set({ isInitialLoad }),
  fetchError: false,
  setFetchError: (fetchError) => set({ fetchError }),
  fetchCounter: 0,
  indexedTransactions: [],
  setIndexedTransactions: (indexedTransactions) => set({ indexedTransactions }),
  pendingIndexedTransactions: null,
  setPendingIndexedTransactions: (pendingIndexedTransactions) =>
    set({ pendingIndexedTransactions }),
  fetchAllTransactions: async ({
    ethAddress,
    availAddress,
    setTransactionLoader,
    isInitialFetch = false,
  }: FetchTxnParams) => {
    const { inProcess, isInitialLoad } = get();

    if (inProcess) {
      return;
    }
    if (!ethAddress && !availAddress) {
      return;
    }

    const currentFetchId = get().fetchCounter + 1;
    set({ fetchCounter: currentFetchId });

    if (isInitialFetch || isInitialLoad) {
      setTransactionLoader(true);
      set({ fetchError: false });
    } else {
      console.log("[Transactions] Fetching in background...");
    }

    try {
      const indexedTxns = await getAllTransactions({
        availAddress,
        ethAddress,
      });

      if (get().fetchCounter === currentFetchId) {
        set({
          pendingIndexedTransactions: [...indexedTxns],
          fetchError: false,
          isInitialLoad: false,
        });
      }
    } catch (error) {
      console.error("[Transactions] Fetch failed:", error);
      if (get().fetchCounter === currentFetchId) {
        set({ fetchError: true });
      }
    } finally {
      if (
        (isInitialFetch || get().isInitialLoad) &&
        get().fetchCounter === currentFetchId
      ) {
        setTransactionLoader(false);
      }
    }
  },
  pollingIntervalId: null,
  startPolling: ({ ethAddress, availAddress }) => {
    const { pollingIntervalId, stopPolling } = get();

    if (pollingIntervalId) {
      stopPolling();
    }

    const intervalId = setInterval(() => {
      const { setTransactionLoader } = get();
      get().fetchAllTransactions({
        ethAddress,
        availAddress,
        setTransactionLoader,
        isInitialFetch: false,
      });
    }, 20000);

    set({ pollingIntervalId: intervalId });
  },
  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },
  pendingTransactionsNumber: 0,
  setPendingTransactionsNumber: (pendingTransactionsNumber) =>
    set({ pendingTransactionsNumber }),
  readyToClaimTransactionsNumber: 0,
  setReadyToClaimTransactionsNumber: (readyToClaimTransactionsNumber) =>
    set({ readyToClaimTransactionsNumber }),
  transactionStatus: TransactionStatus.PENDING,
  setTransactionStatus: (transactionStatus) => set({ transactionStatus }),
}));
