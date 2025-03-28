"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { appConfig } from "@/config/default";
import { capitalizeFirstLetter, IAddress } from "@/hooks/wormhole/helper";
import { useCommonStore } from "@/stores/common";
import { getHref } from "@/utils/common";
import { AlertCircle, ArrowUpRight, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import { useFinalityTracker } from "@/hooks/common/useFinalityTracker";
import Loader from "./loader";
import DestinationStatus from "./destinationstatus";
import { getStepStatus } from "./utils";
import { Badge } from "../ui/badge";
import { useTransactionsStore } from "@/stores/transactions";
import { TransactionStatus } from "@/types/common";

export const SuccessDialog = () => {
  const { successDialog } = useCommonStore();
  const { isOpen, onOpenChange, details, claimDialog } = successDialog;
  const { transactionStatus } = useTransactionsStore();
  const { status, timeEstimate, isLoading } = useFinalityTracker(
    details?.hash as IAddress,
    details?.chain,
    details?.isWormhole
  );

  const getMessage = () =>
    claimDialog ? (
      <>
        Your <span className="text-white">claim transaction</span> was
        successfully submitted to the destination chain. Your funds will be
        deposited to the destination account, generally within{" "}
        <span className="text-white italics">~2-5 minutes.</span>
      </>
    ) : (
      <>
        {details?.isWormhole && (
          <span className="mb-4 flex flex-row items-start space-x-1">
            {" "}
            <AlertCircle className="w-5 h-5" />{" "}
            <p>
              You can only track the progress of this transaction on Wormhole
              Scan.
            </p>
          </span>
        )}
        Your <span className="text-white">bridge transaction</span> was
        successful on the source chain.{" "}
        {details?.isLiquidityBridge ? (
          <>
            Your transaction shall be picked up in the next 5 minutes and will
            be fulfilled.
            <p>
              You can close this tab in the meantime, or initiate another
              transfer.
            </p>
          </>
        ) : details?.isWormhole ? (
          <>
            Your funds should automically reach the destination chain in{" "}
            <span className="text-white italics text-md">~18-20 minutes.</span>{" "}
            <p>
              You can close this tab in the meantime, or initiate another
              transfer.
            </p>
          </>
        ) : (
          <>
            Check back in{" "}
            <span className="text-white italics text-md">
              ~2 hours to claim on destination chain.
            </span>
            <p>
              You can close this tab in the meantime, or initiate another
              transfer.
            </p>
            <Badge className="bg-[#20242C] -ml-2">
              {" "}
              <AlertCircle className="text-opacity-50 text-white w-4 h-4 mr-2" />
              This is a manual claim transaction
            </Badge>
          </>
        )}
      </>
    );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-[#252831] !border-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="font-thicccboisemibold text-white text-2xl">
            Transaction Status
          </DialogTitle>
        </DialogHeader>
        <div className="w-[100%] h-20 mx-auto rounded-xl bg-[#21242d] flex flex-col items-center justify-center">
          {/* In case of Liquidity Bridge use this transaction status, since it tracks status directly from the backend, for others, use isLoading */}
          {details?.isLiquidityBridge ? (
            transactionStatus === TransactionStatus.CLAIMED ? (
              <FaCheckCircle className="mr-4 h-8 w-8" color="0BDA51" />
            ) : (
              <div className="flex flex-row items-center justify-center">
                <Loader />{" "}
                <span className="text-white border-r border-white h-8 border-opacity-30 border mr-4 ml-2"></span>{" "}
                <p className="font-thicccboisemibold text-white text-opacity-70">
                  {" "}
                  Processing..
                </p>
              </div>
            )
          ) : isLoading ? (
            <div className="flex flex-row items-center justify-center">
              <Loader />{" "}
              <span className="text-white border-r border-white h-8 border-opacity-30 border mr-4 ml-2"></span>{" "}
              <p className="font-thicccboisemibold text-white text-opacity-70">
                {" "}
                Processing..
              </p>
            </div>
          ) : (
            <FaCheckCircle className="mr-4 h-8 w-8" color="0BDA51" />
          )}
        </div>
        <div className="flex flex-col items-center justify-center !space-x-3 pt-4 px-1.5">
          <div className="flex flex-col space-y-2">
            <div className="font-ppmori text-white text-sm text-opacity-60 space-y-3 -mt-1 ">
              {getMessage()}
            </div>
          </div>
        </div>

        {/* Source Chain Details / STEPS */}
        <div className="flex flex-col space-y-4 py-3">
          <div className="space-y-1">
            {!claimDialog && (
              <h1 className="font-thicccboisemibold text-white text-lg pb-1">
                Track Status
              </h1>
            )}
            {[
              { step: 1, title: "Submitting on source chain" },
              { step: 2, title: "Awaiting Confirmations" },
            ].map(({ step, title }) => {
              const stepStatus = getStepStatus(step, status);
              return (
                <div key={step} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 justify-center">
                    <span className="font-ppmori text-white text-sm text-opacity-60">
                      {title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {stepStatus === "processing" && (
                      <>
                        <Loader2 className="h-3 w-3 animate-[spin_0.4s_linear_infinite] text-white" />
                        <span className="text-white font-ppmori text-lg">
                          {timeEstimate}
                        </span>
                      </>
                    )}
                    {stepStatus === "done" && (
                      <CheckCircle className="h-5 w-5 text-[#0BDA51]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Destination Chain Details */}
        {(!details?.isWormhole && !claimDialog) &&  (
          <div className="flex flex-row items-center justify-between">
            <h1 className="font-thicccboisemibold text-white text-lg">
            Destination Status
            </h1>
            <DestinationStatus />
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="sm:justify-start mt-1">
          <div className="w-full flex flex-col items-center justify-center space-y-2">
            {details?.isWormhole ? (
              <Link
                target="_blank"
                aria-disabled={!details}
                href={`https://wormholescan.io/#/tx/${details.hash}?network=${
                  capitalizeFirstLetter(appConfig.config) as
                    | "Mainnet"
                    | "Testnet"
                }&view=progress`}
                className="w-full !border-0"
              >
                <Button
                  type="button"
                  variant="primary"
                  className="w-full !bg-[#C1BBF6] !border-0"
                >
                  View on Wormhole Scan <ArrowUpRight className="h-3 w-6" />
                </Button>
              </Link>
            ) : (
              <Link
                target="_blank"
                aria-disabled={!details}
                href={
                  details
                    ? getHref(details.chain, details.hash)
                    : "#transactions"
                }
                className="w-full !border-0"
              >
                <Button
                  type="button"
                  variant="primary"
                  className="w-full !border-0"
                >
                  View Source Txn on Explorer{" "}
                  <ArrowUpRight className="h-3 w-6" />
                </Button>
              </Link>
            )}

            <a
              href="https://avail-project.notion.site/159e67c666dd811c8cf5e13903418d78"
              className="text-white text-opacity-70 underline mx-auto text-sm"
              target="_blank"
            >
              Submit feedback?
            </a>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
