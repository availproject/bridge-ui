
import { Chain } from "@/types/common";
import { create } from "zustand";

interface CommonStore {
    fromChain: Chain
    setFromChain: (fromChain: Chain) => void
    toChain: Chain
    setToChain: (toChain: Chain) => void
    fromChainBalance: number | undefined
    setFromChainBalance: (fromChainBalance: number | undefined) => void
    toChainBalance: number | undefined
    setToChainBalance: (toChainBalance: number | undefined) => void
}

export const useCommonStore = create<CommonStore>((set) => ({
    fromChain: Chain.AVAIL,
    setFromChain: (fromChain) => set({ fromChain }),
    toChain: Chain.ETH,
    setToChain: (toChain) => set({ toChain }),
    fromChainBalance: undefined,
    setFromChainBalance: (fromChainBalance) => set({ fromChainBalance }),
    toChainBalance: undefined,
    setToChainBalance: (toChainBalance) => set({ toChainBalance }),
}));

