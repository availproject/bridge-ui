import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle, InfoIcon, ArrowUpRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useTransactions from "@/hooks/useTransactions";
import { useCommonStore } from "@/stores/common";
import { StatusBadge } from "../sections/transactions/statusbadge";
import { Chain, TransactionStatus } from "@/types/common";
import Link from "next/link";
import { getHref } from "@/utils/common";
import { useTransactionsStore } from "@/stores/transactions";
import { formatEstimatedTime } from "./utils";
import { Logger } from "@/utils/logger";
import { useLiquidityStatusQuery } from "@/hooks/queries/useLiquidityStatusQuery";

function getLiquidityBridgeStatus(status: string | undefined): TransactionStatus {
  switch (status) {
    case "Bridged":
      return TransactionStatus.CLAIMED;
    case "InProgress":
      return TransactionStatus.INITIATED;
    case "ClaimPending":
      return TransactionStatus.PENDING;
    case "Error":
      return TransactionStatus.ERROR;
    default:
      return TransactionStatus.INITIATED;
  }
}

function getTooltipText(status: string | undefined): string {
  switch (status) {
    case "Bridged":
      return "Your funds were bridged";
    case "InProgress":
      return "Your txn will be picked up soon";
    case "ClaimPending":
      return "Automatic bridging in progress";
    case "Error":
      return "There was something wrong with your txn, please report on Discord";
    default:
      return "Your txn will be picked up soon";
  }
}

const DestinationStatus = () => {
  const { successDialog } = useCommonStore();
  const { details } = successDialog;
  const { pendingTransactions } = useTransactions();
  const { setTransactionStatus } = useTransactionsStore();

  const [isOpen, setIsOpen] = useState(false);

  const matchingTxn = pendingTransactions.find(
    (txn) => txn.sourceTransactionHash === details?.hash,
  );

  const { data: liquidityData } = useLiquidityStatusQuery(
    details?.chain,
    details?.id,
    !!details?.isLiquidityBridge,
  );

  const liquidityStatus = liquidityData?.status;
  const liquidityClaimTxn = details?.chain === Chain.BASE
    ? liquidityData?.bridged_block_hash
    : liquidityData?.bridged_tx_hash;
  const liquidityTime = liquidityData?.time_remaining_secs;

  useEffect(() => {
    if (!liquidityData) return;

    const mapped = getLiquidityBridgeStatus(liquidityData.status);
    if (mapped === TransactionStatus.CLAIMED) {
      setTransactionStatus(TransactionStatus.CLAIMED);
    }
    if (mapped === TransactionStatus.ERROR) {
      setTransactionStatus(TransactionStatus.ERROR);
      Logger.debug(
        `LIQUIDITY_BRIDGE TRANSACTION_ERROR_AFTER_SUCCESS_TRANSFER ${details?.id} ${details?.hash} ${liquidityData.status} ${liquidityData.bridged_tx_hash} ${liquidityData.bridged_block_hash} ${liquidityData.time_remaining_secs}`,
      );
    }
  }, [liquidityData, setTransactionStatus, details?.id, details?.hash]);

  if (details?.isLiquidityBridge) {
    return (
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center">
                {liquidityStatus === "Bridged" && liquidityClaimTxn ? (
                  <>
                    <Link
                      href={getHref(
                        details?.chain === Chain.AVAIL
                          ? Chain.BASE
                          : Chain.AVAIL,
                        liquidityClaimTxn,
                        details?.chain === Chain.AVAIL ? false : true,
                      )}
                      className="text-white text-opacity-70 text-md underline"
                      target="_blank"
                    >
                      Destination Txn
                    </Link>
                    <ArrowUpRight className="h-5 w-6 text-white text-opacity-70" />
                  </>
                ) : (
                  <div className="flex flex-row items-center justify-between">
                    {liquidityStatus === "Error" ? (
                      <InfoIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      liquidityTime != null && liquidityTime > 0 ? (
                        <p className="text-white text-opacity-70 text-md">
                          {formatEstimatedTime(liquidityTime)}
                        </p>
                      ) : null
                    )}
                    <StatusBadge
                      txnStatus={getLiquidityBridgeStatus(liquidityStatus)}
                    />
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="mb-2 p-2 text-opacity-75 bg-[#2B3042] text-white !border-0"
            >
              <p>{getTooltipText(liquidityStatus)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  if (details?.isWormhole) {
    return (
      <TooltipProvider>
        <Tooltip open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-[#0BDA51]" />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="mb-2 p-2 text-opacity-75 bg-[#2B3042] text-white !border-0 flex items-center justify-center space-x-1"
          >
            <p>No manual claim needed for Wormhole transfers</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!matchingTxn) {
    return <Loader2 className="h-5 w-5 text-white animate-spin" />;
  }

  return matchingTxn.status === "READY_TO_CLAIM" || matchingTxn.status === "RETRY" ? (
    <span className="text-white text-opacity-60 text-xs text-right">
      Ready — claim in Pending tab
    </span>
  ) : (
    <StatusBadge txnStatus={matchingTxn.status} />
  );
};

export default DestinationStatus;
