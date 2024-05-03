import { appConfig } from "@/config/default";
import { create } from "zustand";

export interface LatestBlockInfo {
  ethHead: {
    slot: number;
    timestamp: number;
    timestampDiff: number;
  };
  latestBlockhash: string;
  setLatestBlockhash: (latestBlockhash: string) => void;
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
  latestBlockhash: "",
  setLatestBlockhash: (latestBlockhash) => set({ latestBlockhash }),
  setEthHead: (ethHead) => set({ ethHead }),
  avlHead: {
    data: {
      end: 0,
      start: 0,
    },
  },
  setAvlHead: (avlHead) => set({ avlHead }),
}));

