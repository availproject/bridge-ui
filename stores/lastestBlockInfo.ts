import { appConfig } from "@/config/default";
import { create } from "zustand";

export interface LatestBlockInfo {
  ethHead: {
    slot: number;
    blockNumber: number;
    blockHash: string;
    timestamp: number;
    timestampDiff: number;
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
    blockNumber: 0,
    blockHash: "",
    timestampDiff: 0,
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

