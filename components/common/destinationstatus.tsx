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
import { SubmitClaim } from "../sections/transactions/submitclaim";
import { RetryTxns } from "../sections/transactions/retrytxns";
import { StatusBadge } from "../sections/transactions/statusbadge";
import { appConfig } from "@/config/default";
import { Chain, TransactionStatus } from "@/types/common";
import Link from "next/link";
import { getHref } from "@/utils/common";
import { useTransactionsStore } from "@/stores/transactions";
import { formatEstimatedTime } from "./utils";
import { Logger } from "@/utils/logger";

const DestinationStatus = () => {
  const { successDialog, toChain } = useCommonStore();
  const { details } = successDialog;
  const { pendingTransactions } = useTransactions();
  const { setTransactionStatus } = useTransactionsStore();

  const [directLoading, setDirectLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [liquidityStatus, setLiquidityStatus] = useState<string | null>(null);
  const [liquidityClaimTxn, setLiquidityClaimTxn] = useState<string | null>(
    null,
  );
  const [liqudityTime, setLiquidityTime] = useState<number | null>(null);

  const matchingTxn = pendingTransactions.find(
    (txn) => txn.sourceTransactionHash === details?.hash,
  );

  const getLiquidityBridgeStatus = (status: string | null) => {
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
  };

  const getTooltipText = (status: string | null) => {
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
  };

  useEffect(() => {
    if (!details?.isLiquidityBridge || !details.id) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${appConfig.liquidityBridgeApiBaseUrl}/v1/${details.chain === Chain.BASE ? "eth_to_avail" : "avail_to_eth"}/status?id=${details.id}`,
        );
        if (!response.ok) throw new Error("Failed to fetch status");
        const data = await response.json();

        setLiquidityStatus(data[0].status);
        setLiquidityClaimTxn(
          details.chain === Chain.BASE
            ? data[0].bridged_block_hash
            : data[0].bridged_tx_hash,
        );
        setLiquidityTime(data[0].time_remaining_secs);

        if (
          getLiquidityBridgeStatus(data[0].status) === TransactionStatus.CLAIMED
        ) {
          setTransactionStatus(TransactionStatus.CLAIMED);
        }

        if (
          getLiquidityBridgeStatus(data[0].status) === TransactionStatus.ERROR
        ) {
          setTransactionStatus(TransactionStatus.ERROR);
          Logger.debug(
            `LIQUIDITY_BRIDGE TRANSACTION_ERROR_AFTER_SUCCESS_TRANSFER ${details.id} ${details.hash} ${data[0].status} ${data[0].bridged_tx_hash} ${data[0].bridged_block_hash} ${data[0].time_remaining_secs}`,
          );
        }
      } catch (error) {
        console.error("Failed to fetch liquidity bridge status:", error);
      }
    };

    const interval = setInterval(checkStatus, 10000);
    checkStatus();

    return () => clearInterval(interval);
  }, [
    details?.hash,
    details?.id,
    details?.isLiquidityBridge,
    setTransactionStatus,
    toChain,
    liquidityStatus,
  ]);

  if (details?.isLiquidityBridge) {
    return (
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center">
                {liquidityStatus === "Bridged" && liquidityClaimTxn ? (
                  <>
                    {/* this should be ideally disabled instead in destinationChain is not defined, and also when liquidityClaimTxn does not show up */}
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
                      liqudityTime && (
                        <p className="text-white text-opacity-70 text-md">
                          {formatEstimatedTime(liqudityTime)}
                        </p>
                      )
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

  return matchingTxn.status === "READY_TO_CLAIM" ? (
    <SubmitClaim
      txn={matchingTxn}
      isLoading={directLoading}
      setIsLoading={setDirectLoading}
    />
  ) : matchingTxn.status === "RETRY" ? (
    <RetryTxns
      txn={matchingTxn}
      isLoading={directLoading}
      setIsLoading={setDirectLoading}
    />
  ) : (
    <StatusBadge txnStatus={matchingTxn.status} />
  );
};

export default DestinationStatus;
