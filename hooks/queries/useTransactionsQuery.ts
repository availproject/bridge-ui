import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useAvailAccount } from "@/stores/availwallet";
import { useTransactionsStore } from "@/stores/transactions";
import { getAllTransactions } from "@/services/transactions";
import { useCallback, useRef, useState, useEffect } from "react";

/**
 * Wait for wallet connections to stabilize before fetching.
 *
 * Problem: Avail wallet restores from localStorage instantly while wagmi
 * reconnects async, so without a grace period the first fetch fires with
 * only availAddress, producing a partial result that gets replaced moments
 * later when ethAddress arrives (wasted request + UI flash).
 *
 * Solution: once *any* wallet is present, wait a short window for the
 * other to connect before enabling the query.  If both arrive within the
 * window the query fires once with the full set of addresses.
 */
const WALLET_SETTLE_MS = 1_500;

export function useTransactionsQuery() {
  const { address: ethAddress, isReconnecting: ethReconnecting } = useAccount();
  const { selected } = useAvailAccount();
  const availAddress = selected?.address;
  const inProcess = useTransactionsStore((s) => s.inProcess);
  const queryClient = useQueryClient();

  const [settled, setSettled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bothPresent = !!(ethAddress && availAddress);

  useEffect(() => {
    if (!ethAddress && !availAddress) {
      setSettled(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (bothPresent) {
      setSettled(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (ethReconnecting) return;
    if (!settled && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setSettled(true);
      }, WALLET_SETTLE_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [ethAddress, availAddress, bothPresent, ethReconnecting, settled]);

  const query = useQuery({
    queryKey: ["transactions", ethAddress ?? null, availAddress ?? null],
    queryFn: () =>
      getAllTransactions({
        ethAddress: ethAddress ?? undefined,
        availAddress: availAddress ?? undefined,
      }),
    enabled: settled && !!(ethAddress || availAddress),
    refetchInterval: inProcess ? false : 20_000,
    staleTime: 10_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }, [queryClient]);

  return { ...query, refetch };
}
