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
import { StatusBadge } from "../sections/transactions/statusbadge";
import { appConfig } from "@/config/default";
import { Chain, TransactionStatus } from "@/types/common";
import Link from "next/link";
import { getHref } from "@/utils/common";

const DestinationStatus = () => {
  const { successDialog, toChain  } = useCommonStore();
  const { details } = successDialog;
  const { pendingTransactions } = useTransactions();

  const [directLoading, setDirectLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [liquidityStatus, setLiquidityStatus] = useState<string | null>(null);
  const [liquidityClaimTxn, setLiquidityClaimTxn] = useState<string | null>(null);

  const matchingTxn = pendingTransactions.find(
    (txn) => txn.sourceTransactionHash === details?.hash
  );

  useEffect(() => {
    if (!details?.isLiquidityBridge || !details.id) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${appConfig.liquidityBridgeApiBaseUrl}/v1/${toChain === Chain.AVAIL ? 'eth_to_avail' : 'avail_to_eth'}/status?id=${details.id}`
        );
        if (!response.ok) throw new Error('Failed to fetch status');
        const data = await response.json();
        setLiquidityStatus(data.status);
        setLiquidityClaimTxn(toChain === Chain.BASE ? data.bridged_tx_hash : data.bridged_block_hash)
      } catch (error) {
        console.error('Failed to fetch liquidity bridge status:', error);
      }
    };

    const interval = setInterval(checkStatus, 10000);
    checkStatus();

    return () => clearInterval(interval);
  }, [details?.id, details?.isLiquidityBridge, toChain]);

  if (details?.isLiquidityBridge) {
    const getLiquidityBridgeStatus = (status: string | null) => {
      switch (status) {
        case 'Bridged':
          return TransactionStatus.CLAIMED;
        case 'InProgress':
          return TransactionStatus.INITIATED
        case 'ClaimPending':
          return TransactionStatus.PENDING;
        default:
          return TransactionStatus.PENDING;
      }
    };

    const getTooltipText = (status: string | null) => {
      switch (status) {
        case 'Bridged':
          return "Your funds were bridged";
        case 'InProgress':
          return "Your txn will be picked up soon";
        case 'ClaimPending':
          return "Automatic bridging in progress (~5 minutes)";
        default:
          return "Automatic bridging in progress (~5 minutes)";
      }
    };

    return (
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center">
                {liquidityStatus === 'Bridged' ? (
                  <>
                 <Link href={getHref(toChain, liquidityClaimTxn ?? "0x", toChain === Chain.AVAIL)} className="text-white text-opacity-70 text-md underline" target="_blank">Destination Txn</Link><ArrowUpRight className="h-5 w-6 text-white text-opacity-70" /> </>
                ) : (
                  <StatusBadge txnStatus={getLiquidityBridgeStatus(liquidityStatus)} />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="mb-2 p-2 text-opacity-75 bg-[#2B3042] text-white !border-0">
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
          <TooltipTrigger onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-[#0BDA51]" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="mb-2 p-2 text-opacity-75 bg-[#2B3042] text-white !border-0 flex items-center justify-center space-x-1">
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
  ) : (
    <StatusBadge txnStatus={matchingTxn.status}/>
  );
};

export default DestinationStatus;