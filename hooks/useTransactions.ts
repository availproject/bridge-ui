import { useMemo } from "react";
import { TransactionStatus } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { useTransactionsQuery } from "./queries/useTransactionsQuery";

const CHUNK_SIZE = 4;

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default function useTransactions() {
  const { data: allTransactions = [], isLoading, isError, refetch } = useTransactionsQuery();

  const { pendingTransactions, completedTransactions } = useMemo(() => {
    const pending: Transaction[] = [];
    const completed: Transaction[] = [];
    for (const txn of allTransactions) {
      if (txn.status === TransactionStatus.CLAIMED) {
        completed.push(txn);
      } else {
        pending.push(txn);
      }
    }
    const byTime = (a: Transaction, b: Transaction) =>
      b.sourceTimestamp - a.sourceTimestamp;
    return {
      pendingTransactions: pending.toSorted(byTime),
      completedTransactions: completed.toSorted(byTime),
    };
  }, [allTransactions]);

  const paginatedPendingTransactions = useMemo(
    () => chunk(pendingTransactions, CHUNK_SIZE),
    [pendingTransactions],
  );

  const paginatedCompletedTransactions = useMemo(
    () => chunk(completedTransactions, CHUNK_SIZE),
    [completedTransactions],
  );

  return {
    allTransactions,
    pendingTransactions,
    completedTransactions,
    paginatedPendingTransactions,
    paginatedCompletedTransactions,
    isLoading,
    isError,
    refetch,
  };
}
