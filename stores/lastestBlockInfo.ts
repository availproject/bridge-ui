import { create } from "zustand";

interface LatestBlockInfo {
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

async function fetchAvlHead(): Promise<{ data: LatestBlockInfo["avlHead"] }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BRIDGE_API_URL}/eth/head`
  );
  const avlHead: LatestBlockInfo["avlHead"] = await response.json();
  return { data: avlHead };
}

async function fetchEthHead() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BRIDGE_API_URL}/eth/head`
  );
  const data = await response.json();
  return data;
}
