import { LoadingButton } from "@/components/ui/loadingbutton";
import useClaim from "@/hooks/useClaim";
import { useCommonStore } from "@/stores/common";
import { useTransactionsStore } from "@/stores/transactions";
import { Chain } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { Logger } from "@/utils/logger";
import { showFailedMessage } from "@/utils/toasts";

interface SubmitClaimProps {
  txn: Transaction;
  loadingTxns?: Set<unknown>;
  setTxnLoading?: (txnHash: `0x${string}`, loading: boolean) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

export const SubmitClaim = ({
  txn,
  loadingTxns,
  setTxnLoading,
  isLoading: directLoading,
  setIsLoading: setDirectLoading,
}: SubmitClaimProps) => {
  const { initClaimAvailToEth, initClaimEthtoAvail } = useClaim();
  const {
    successDialog: { onOpenChange: setOpenDialog, setDetails, setClaimDialog },
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

  const onSubmit = async (
    chainFrom: Chain,
    blockhash: `0x${string}`,
    txnHash: `0x${string}`,
    sourceTimestamp: string,
    atomicAmount: string,
    sourceTransactionIndex?: number,
    executeParams?: {
      messageid: number;
      amount: string | number;
      from: `${string}`;
      to: `${string}`;
      originDomain: number;
      destinationDomain: number;
    },
  ) => {
    updateLoadingState(txnHash, true);
    setClaimDialog(true);
    setInProcess(true);

    try {
      if (
        chainFrom === Chain.AVAIL &&
        blockhash &&
        sourceTransactionIndex &&
        executeParams
      ) {
        const successBlockhash = await initClaimAvailToEth({
          blockhash,
          sourceTransactionIndex,
          sourceTransactionHash: txnHash,
          sourceTimestamp,
          atomicAmount,
          senderAddress: executeParams.from,
          receiverAddress: executeParams.to,
        });

        if (successBlockhash) {
          setDetails({
            chain: Chain.ETH,
            hash: successBlockhash,
          });
          setOpenDialog(true);
        }
      } else if (chainFrom === Chain.ETH && blockhash && executeParams) {
        const successBlockhash = await initClaimEthtoAvail({
          sourceTransactionHash: txnHash,
          sourceTimestamp,
          atomicAmount,
          executeParams,
        });

        if (successBlockhash.txHash) {
          setDetails({
            chain: Chain.AVAIL,
            hash: successBlockhash.txHash,
          });

          setOpenDialog(true);
        }
      } else {
        showFailedMessage({ title: "Invalid Transaction" });
      }
    } catch (e: any) {
      Logger.error(e);
      setError(e.message);
      setErrorOpenDialog(true);
    } finally {
      updateLoadingState(txnHash, false);
      setInProcess(false);
    }
  };

  return (
    <LoadingButton
      variant="primary"
      loading={isLoading}
      disabled={isLoading}
      loadingMessage="Please Sign"
      className="!px-4 !py-0 rounded-xl whitespace-nowrap"
      onClick={async () => {
        await onSubmit(
          txn.sourceChain,
          txn.sourceBlockHash as `0x${string}`,
          txn.sourceTransactionHash,
          txn.sourceTimestamp,
          txn.amount,
          txn.sourceTransactionIndex,
          {
            messageid: txn.messageId!,
            amount: txn.amount,
            from: txn.depositorAddress,
            to: txn.receiverAddress,
            originDomain: 2,
            destinationDomain: 1,
          },
        );
      }}
    >
      {txn.status === "READY_TO_CLAIM" ? "Claim Ready" : txn.status}
    </LoadingButton>
  );
};
