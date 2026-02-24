import { TransactionStatus } from "@/types/common";
import { create } from "zustand";

interface TransactionsStore {
  /** inProcess — pause polling while a claim is in progress */
  inProcess: boolean;
  setInProcess: (inProcess: boolean) => void;
  /** transactionStatus — tracks current bridge flow status for UI */
  transactionStatus: TransactionStatus;
  setTransactionStatus: (status: TransactionStatus) => void;
  /** claimedHashes — txns claimed this session, prevents re-showing claim button */
  claimedHashes: Set<string>;
  addClaimedHash: (hash: string) => void;
}

export const useTransactionsStore = create<TransactionsStore>((set) => ({
  inProcess: false,
  setInProcess: (inProcess) => set({ inProcess }),
  transactionStatus: TransactionStatus.PENDING,
  setTransactionStatus: (transactionStatus) => set({ transactionStatus }),
  claimedHashes: new Set(),
  addClaimedHash: (hash) =>
    set((state) => ({
      claimedHashes: new Set(state.claimedHashes).add(hash),
    })),
}));
