import { LoadingButton } from "@/components/ui/loadingbutton";
import useLiquidityBridge from "@/hooks/useLiquidityBridge";
import { useCommonStore } from "@/stores/common";
import { useTransactionsStore } from "@/stores/transactions";
import { Transaction } from "@/types/transaction";
import { Logger } from "@/utils/logger";
import { RotateCcw } from "lucide-react";

interface RetryTxnsProps {
  txn: Transaction;
  loadingTxns?: Set<unknown>;
  setTxnLoading?: (txnHash: `0x${string}`, loading: boolean) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

export const RetryTxns = ({
  txn,
  loadingTxns,
  setTxnLoading,
  isLoading: directLoading,
  setIsLoading: setDirectLoading,
}: RetryTxnsProps) => {
  const { retryLiquidityBridgeTxn } = useLiquidityBridge();
  const {
    successDialog: { onOpenChange: setOpenDialog, setDetails },
    errorDialog: { onOpenChange: setErrorOpenDialog, setError },
  } = useCommonStore();
  const { setInProcess } = useTransactionsStore();

  const isLoading =
    directLoading ?? loadingTxns?.has(txn.sourceTransactionHash) ?? false;

  const updateLoadingState = (txnHash: `0x${string}`, loading: boolean) => {
    if (setTxnLoading) {
      setTxnLoading(txnHash, loading);
    }
    setDirectLoading && setDirectLoading(loading);
  };

  const onRetry = async () => {
    updateLoadingState(txn.sourceTransactionHash, true);
    setInProcess(true);

    try {
      // Determine signOn chain based on transaction source chain
      const signOn = txn.sourceChain;

      const result = await retryLiquidityBridgeTxn({
        signOn,
        response: txn,
      });

      if (result && result.hash) {
        setDetails({
          chain: result.chain,
          hash: result.hash,
          id: Number(result.id),
          isLiquidityBridge: true,
        });
        setOpenDialog(true);
      }
    } catch (error: any) {
      Logger.error("Retry transaction failed:", error);
      setError(error.message || "Failed to retry transaction");
      setErrorOpenDialog(true);
    } finally {
      updateLoadingState(txn.sourceTransactionHash, false);
      setInProcess(false);
    }
  };

  return (
    <LoadingButton
      variant="default"
      loading={isLoading}
      disabled={isLoading}
      loadingMessage="Retrying..."
      className="w-full rounded-xl font-thicccboibold px-4 py-3 !bg-[#395358] border-2 border-green-500 !text-white hover:bg-green-500/10 transition-colors duration-300 relative overflow-hidden"
      onClick={onRetry}
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      Retry Now
    </LoadingButton>
  );
};
