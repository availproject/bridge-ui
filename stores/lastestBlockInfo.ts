import { appConfig } from "@/config/default";
import { create } from "zustand";

export interface LatestBlockInfo {
  ethHead: {
    slot: number;
    timestamp: number;
    timestampDiff: number;
     blockNumber: number,
    blockHash: string,
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
}

export const useLatestBlockInfo = create<LatestBlockInfo>((set) => ({
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
}));

