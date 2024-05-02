import { appConfig } from "@/config/default";
import { create } from "zustand";

export interface LatestBlockInfo {
  ethHead: {
    slot: number;
    timestamp: number;
    timestampDiff: number;
  };
  setEthHead: (ethHead: LatestBlockInfo["ethHead"]) => void;
  avlHead: {
    data: {
      end: number;
      start: number;
    };
  };
  setAvlHead: (avlHead: LatestBlockInfo["avlHead"]) => void;
}

export const useLatestBlockInfo = create<LatestBlockInfo>((set) => ({
  ethHead: {
    slot: 0,
    timestamp: 0,
    timestampDiff: 0,
  },
  setEthHead: (ethHead) => set({ ethHead }),
  avlHead: {
    data: {
      end: 0,
      start: 0,
    },
  },
  setAvlHead: (avlHead) => set({ avlHead }),
}));

