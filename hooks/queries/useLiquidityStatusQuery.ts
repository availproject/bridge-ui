import { useQuery } from "@tanstack/react-query";
import { appConfig } from "@/config/default";
import { Chain } from "@/types/common";

interface LiquidityStatusData {
  status: string;
  bridged_block_hash: string | null;
  bridged_tx_hash: string | null;
  time_remaining_secs: number | null;
}

export function useLiquidityStatusQuery(
  chain: Chain | undefined,
  id: number | undefined,
  enabled: boolean,
) {
  const endpoint =
    chain === Chain.BASE ? "eth_to_avail" : "avail_to_eth";

  return useQuery<LiquidityStatusData>({
    queryKey: ["liquidityStatus", id],
    queryFn: async () => {
      const response = await fetch(
        `${appConfig.liquidityBridgeApiBaseUrl}/v1/${endpoint}/status?id=${id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      return data[0];
    },
    enabled: enabled && !!id,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}
