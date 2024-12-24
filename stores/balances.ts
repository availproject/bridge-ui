

import { getTokenBalance } from "@/services/contract";
import { Chain } from "@/types/common";
import { ApiPromise } from "avail-js-sdk";
import { create } from "zustand";

type TokenBalance = {
  value: string;
  status: "loading" | "success" | "error";
  error?: string;
};

interface BalanceState {
  balances: Record<Chain, TokenBalance>;
  fetchBalance: (address: string, chain: Chain, api?: ApiPromise) => Promise<void>;
}

const initialBalances: Record<Chain, TokenBalance> = {
  [Chain.ETH]: { value: "", status: "loading" },
  [Chain.BASE]: { value: "", status: "loading" },
  [Chain.AVAIL]: { value: "", status: "loading" },
};

export const useBalanceStore = create<BalanceState>((set) => ({
  balances: initialBalances,
  fetchBalance: async (address: string, chain: Chain, api?: ApiPromise) => {
    try {
        if(!api && chain === Chain.AVAIL) {
          throw new Error("API not connected")
        }
      const balance = await getTokenBalance(chain, address, api);
      set((state) => ({
        balances: {
          ...state.balances,
          [chain]: { status: "success", value: balance },
        },
      }));
    } catch (error) {
      set((state) => ({
        balances: {
          ...state.balances,
          [chain]: {
            status: "error",
            value: "",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
      }));
    }
  },
}));
