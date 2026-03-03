import { useQuery } from "@tanstack/react-query";
import { reviewTxn, ReviewResponse } from "@/services/bridgeapi";
import { Chain } from "@/types/common";
import BigNumber from "bignumber.js";

export function useReviewTxnQuery(
  fromAmount: string,
  fromChain: Chain,
  enabled: boolean,
) {
  return useQuery<ReviewResponse>({
    queryKey: ["reviewTxn", fromAmount, fromChain],
    queryFn: async () => {
      const atomicAmount = new BigNumber(fromAmount)
        .multipliedBy(new BigNumber(10).pow(18))
        .toFixed(0);
      const result = await reviewTxn(atomicAmount, fromChain);
      if (result.isOk()) return result.value;
      throw new Error("Failed to review transaction");
    },
    enabled,
    staleTime: 0,
  });
}
