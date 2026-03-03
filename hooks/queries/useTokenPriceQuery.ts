import { useQuery } from "@tanstack/react-query";
import { fetchTokenPrice } from "@/services/bridgeapi";

export function useTokenPriceQuery() {
  return useQuery({
    queryKey: ["tokenPrice", "avail", "usd"],
    queryFn: () => fetchTokenPrice({ coin: "avail", fiat: "usd" }),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
