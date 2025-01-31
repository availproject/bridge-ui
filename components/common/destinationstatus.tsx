import React, { useState } from "react";
import { Loader2, CheckCircle, InfoIcon } from "lucide-react";
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

const DestinationStatus = () => {
  const { successDialog } = useCommonStore();
  const { details } = successDialog;
  const { pendingTransactions } = useTransactions();
  const [directLoading, setDirectLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const matchingTxn = pendingTransactions.find(
    (txn) => txn.sourceTransactionHash === details?.hash
  );

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