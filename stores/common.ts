
import { Chain } from "@/types/common";
import { initApi } from "@/utils/common";
import { ApiPromise } from "avail-js-sdk";
import { create } from "zustand";

type ChainBalances = Record<Chain, number>;

interface CommonStore {
    fromChain: Chain
    setFromChain: (fromChain: Chain) => void
    dollarAmount: number
    setDollarAmount: (dollarAmount: number) => void
    toChain: Chain
    setToChain: (toChain: Chain) => void
    api?: ApiPromise
    setApi: (api: ApiPromise) => void
    fromAmount: number
    setFromAmount: (fromAmount: number) => void
    toAddress: string | undefined
    setToAddress: (toAddress: string) => void
}

export const useCommonStore = create<CommonStore>((set) => ({
    fromChain: Chain.AVAIL,
    setFromChain: (fromChain) => set({ fromChain }),
    dollarAmount: 0,
    setDollarAmount: (dollarAmount) => set({ dollarAmount }),
    toChain: Chain.ETH,
    setToChain: (toChain) => set({ toChain }),
    api: undefined,
    setApi: (api) => set({ api }),
    fromAmount: 0,
    setFromAmount: (fromAmount) => set({ fromAmount }),
    toAddress: undefined,
    setToAddress: (toAddress) => set({ toAddress }),
}));

 
