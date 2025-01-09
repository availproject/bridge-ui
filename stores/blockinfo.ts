import { create } from 'zustand';
import { useApi } from '@/stores/api';
import { fetchAvlHead, fetchEthHead } from '@/services/bridgeapi';

export interface LatestBlockInfo {
  ethHead: {
    slot: number;
    timestamp: number;
    timestampDiff: number;
    blockNumber: number;
    blockHash: string;
  };
  setEthHead: (ethHead: LatestBlockInfo["ethHead"]) => void;
  avlHead: {
    data: {
      end: number;
      start: number;
      endTimestamp: number;
    };
  };
  setAvlHead: (avlHead: LatestBlockInfo["avlHead"]) => void;
  loading: boolean;
  error: string | null;
  isLoading: () => boolean;
  fetchAllHeads: () => Promise<void>;
}

export const useLatestBlockInfo = create<LatestBlockInfo>((set, get) => ({
  ethHead: {
    slot: 0,
    timestamp: 0,
    timestampDiff: 0,
    blockNumber: 0,
    blockHash: "",
  },
  setEthHead: (ethHead) => set({ ethHead }),
  avlHead: {
    data: {
      end: 0,
      start: 0,
      endTimestamp: 0,
    },
  },
  setAvlHead: (avlHead) => set({ avlHead }),
  loading: true,
  error: null,
  isLoading: () => {
    const state = get();
    return state.loading || state.error !== null;
  },
  fetchAllHeads: async () => {
    const { api, isReady } = useApi.getState();
    if (!api || !isReady) {
      return; 
    }
    set({ loading: true, error: null });
    
    try {
      const [ethResponse, avlResponse] = await Promise.all([
        fetchEthHead(),
        fetchAvlHead(api)
      ]);

      if (!ethResponse?.data?.timestamp || !ethResponse?.data?.blockNumber) {
        throw new Error('Invalid ETH head data received');
      }

      if (!avlResponse?.data?.data?.end || !avlResponse?.data?.data?.endTimestamp) {
        throw new Error('Invalid AVL head data received');
      }

      set({
        ethHead: ethResponse.data,
        avlHead: avlResponse.data,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error fetching heads:', err);
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch blockchain heads'
      });
    }
  },
}));