import { fetchTokenPrice } from "@/services/bridgeapi";
import { Chain } from "@/types/common";
import { create } from "zustand";

const EMPTY_AMOUNT = "" as const;

interface DialogBase {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SuccessDialog extends DialogBase {
  details: {
    chain: Chain;
    hash: string;
    isWormhole?: boolean;
    isLiquidityBridge?: boolean;
    id?: number;
  } | null;
  setDetails: (details: {
    chain: Chain;
    hash: string;
    isWormhole?: boolean;
    isLiquidityBridge?: boolean;
    id?: number;
  }) => void;
  claimDialog: boolean;
  setClaimDialog: (claimDialog: boolean) => void;
}

interface ErrorDialog extends DialogBase {
  error: Error | string | null;
  setError: (error: Error | string | null) => void;
}

interface WarningDialog extends DialogBase {
  warning: Error | string | null;
  setWarning: (warning: Error | string | null) => void;
  onReject?: () => void;
  onRetry?: () => void;
  setCallbacks: (onReject: () => void, onRetry: () => void) => void;
}
interface CommonStore {
  fromChain: Chain;
  setFromChain: (fromChain: Chain) => void;
  dollarAmount: number;
  setDollarAmount: (dollarAmount: number) => void;
  fetchDollarAmount: () => Promise<number>;
  toChain: Chain;
  setToChain: (toChain: Chain) => void;
  fromAmount: string;
  setFromAmount: (fromAmount: string) => void;
  toAddress: string | undefined;
  setToAddress: (toAddress: string) => void;
  successDialog: SuccessDialog;
  errorDialog: ErrorDialog;
  warningDialog: WarningDialog;
  reviewDialog: DialogBase;
  signatures: string;
  setSignatures: (text: string) => void;
  allowLiquidityBridgeTxn: boolean;
  setAllowLiquidityBridgeTxn: (allow: boolean) => void;
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
        successDialog: { ...state.successDialog, isOpen: open },
      })),
    claimDialog: false,
    setClaimDialog: (claimDialog: boolean) =>
      set((state) => ({
        successDialog: { ...state.successDialog, claimDialog },
      })),
    details: null,
    setDetails: (details: { chain: Chain; hash: string }) =>
      set((state) => ({
        successDialog: { ...state.successDialog, details },
      })),
  },
  errorDialog: {
    isOpen: false,
    onOpenChange: (open: boolean) =>
      set((state) => ({
        errorDialog: { ...state.errorDialog, isOpen: open },
      })),
    error: null,
    setError: (error: Error | string | null) =>
      set((state) => ({
        errorDialog: { ...state.errorDialog, error },
      })),
  },
  warningDialog: {
    isOpen: false,
    onOpenChange: (open: boolean) =>
      set((state) => ({
        warningDialog: { ...state.warningDialog, isOpen: open },
      })),
    warning: null,
    setWarning: (warning: Error | string | null) =>
      set((state) => ({
        warningDialog: { ...state.warningDialog, warning },
      })),
    onReject: undefined,
    onRetry: undefined,
    setCallbacks: (onReject: () => void, onRetry: () => void) =>
      set((state) => ({
        warningDialog: { ...state.warningDialog, onReject, onRetry },
      })),
  },
  reviewDialog: {
    isOpen: false,
    onOpenChange: (open: boolean) =>
      set((state) => ({
        reviewDialog: { ...state.reviewDialog, isOpen: open },
      })),
  },
  signatures: "",
  setSignatures: (text) => set({ signatures: text }),
  allowLiquidityBridgeTxn: true,
  setAllowLiquidityBridgeTxn: (allow) =>
    set({ allowLiquidityBridgeTxn: allow }),
}));
