import { Chain } from "@/@types/types";
import { create } from "zustand";

interface CommonStore {
    fromChain: Chain
    setFromChain: (fromChain: Chain) => void
}

export const useCommonStore = create<CommonStore>((set) => ({
    fromChain: Chain.AVAIL,
    setFromChain: (fromChain) => set({ fromChain }),
}));
