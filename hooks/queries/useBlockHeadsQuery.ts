import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/stores/api";
import { fetchEthHead, fetchAvlHead } from "@/services/bridgeapi";

export function useBlockHeadsQuery() {
  const { api, isReady } = useApi();

  return useQuery({
    queryKey: ["blockHeads"],
    queryFn: async () => {
      const [ethResponse, avlResponse] = await Promise.all([
        fetchEthHead(),
        fetchAvlHead(api!),
      ]);
      return {
        ethHead: ethResponse.data,
        avlHead: avlResponse.data,
      };
    },
    enabled: !!api && isReady,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}
