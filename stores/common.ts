import { fetchTokenPrice } from "@/services/bridgeapi";
import { Chain } from "@/types/common";
import { create } from "zustand";

const EMPTY_AMOUNT = '' as const

interface DialogBase {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    claimDialog: boolean
}

interface SuccessDialog extends DialogBase {
    details: { chain: Chain; hash: string } | null
    setDetails: (details: { chain: Chain; hash: string }) => void
}

interface ErrorDialog extends DialogBase {
    error: Error | string | null
    setError: (error: Error | string | null) => void
}
interface CommonStore {
    fromChain: Chain
    setFromChain: (fromChain: Chain) => void
    dollarAmount: number
    setDollarAmount: (dollarAmount: number) => void
    fetchDollarAmount: () => Promise<number>
    toChain: Chain
    setToChain: (toChain: Chain) => void
    fromAmount: string
    setFromAmount: (fromAmount: string) => void
    toAddress: string | undefined
    setToAddress: (toAddress: string) => void
    successDialog: SuccessDialog
    errorDialog: ErrorDialog
}

export const useCommonStore = create<CommonStore>((set) => ({
    fromChain: Chain.AVAIL,
    setFromChain: (fromChain) => set({ fromChain }),
    dollarAmount: 0,
    setDollarAmount: (dollarAmount) => set({ dollarAmount }),
    fetchDollarAmount: async () => {
        const price = await fetchTokenPrice({
            coin: "avail",
            fiat: "usd",
        });
        set({ dollarAmount: price });
        return price;
      },
    toChain: Chain.ETH,
    setToChain: (toChain) => set({ toChain }),
    fromAmount: EMPTY_AMOUNT,
    setFromAmount: (fromAmount) => set({ fromAmount }),
    toAddress: undefined,
    setToAddress: (toAddress) => set({ toAddress }),
    successDialog: {
        isOpen: false,
        onOpenChange: (open: boolean) => 
            set((state) => ({ 
                successDialog: { ...state.successDialog, isOpen: open } 
            })),
        claimDialog: false,
        details: null, 
        setDetails: (details: { chain: Chain; hash: string }) => 
            set((state) => ({ 
                successDialog: { ...state.successDialog, details } 
            }))
    },
    errorDialog: {
        isOpen: false,
        onOpenChange: (open: boolean) => 
            set((state) => ({ 
                errorDialog: { ...state.errorDialog, isOpen: open } 
            })),
        claimDialog: false,
        error: null,
        setError: (error: Error | string | null) => 
            set((state) => ({ 
                errorDialog: { ...state.errorDialog, error } 
            }))
    },
}))