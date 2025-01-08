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
import { useTransactionStatus } from "@/hooks/common/useTrackTxnStatus";
import Loader from "./loader";
import DestinationStatus from "./destinationstatus";
import { getStepStatus } from "./utils";

export const SuccessDialog = () => {
  const { successDialog } = useCommonStore();
  const { isOpen, onOpenChange, details, claimDialog } = successDialog;
  const { status, isLoading, timeEstimate } = useTransactionStatus(
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
        {details?.isWormhole ? (
          <>
            Your funds should automically reach the destination chain in{" "}
            <span className="text-white italics text-md">~18-20 minutes.</span>{" "}
          </>
        ) : (
          <>
            Check back in{" "}
            <span className="text-white italics text-md">
              ~2 hours to claim funds{" "}
            </span>
            on the destination chain.
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
        <div className="w-[100%] h-20 mx-auto rounded-xl bg-black flex flex-col items-center justify-center">
          {!isLoading ? (
            <FaCheckCircle className="mr-4 h-8 w-8" color="0BDA51" />
          ) : (
            <Loader />
          )}
        </div>

        {/* Source Chain Details / STEPS */}
        <div className="flex flex-col space-y-4 py-4">
          <div className="space-y-1">
            {!claimDialog && (
              <h1 className="font-thicccboisemibold text-white text-lg pb-2">
                Source Chain
              </h1>
            )}
            {[
              { step: 1, title: "Submitting Transaction" },
              { step: 2, title: "Awaiting Confirmations" },
            ].map(({ step, title }) => {
              const stepStatus = getStepStatus(step, status);
              return (
                <div
                  key={step}
                  className="flex items-center justify-between pb-1"
                >
                  <div className="flex items-center space-x-3 justify-center">
                    <span className="font-ppmori text-white text-sm text-opacity-60">
                      {title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {stepStatus === "processing" && (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
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
        {!claimDialog && (
          <div className="flex flex-row items-center justify-between">
            <h1 className="font-thicccboisemibold text-white text-lg">
              Destination Chain
            </h1>
            <DestinationStatus />
          </div>
        )}
        <div className="flex flex-col items-center justify-center !space-x-3">
          <div className="flex flex-col space-y-2">
            <div className="font-ppmori text-white text-sm text-opacity-60 space-y-3 -mt-1 ">
              {getMessage()}
              <p>
                You can close this tab in the meantime, or initiate another
                transfer.
              </p>
            </div>
          </div>
        </div>

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
                  View on Explorer <ArrowUpRight className="h-3 w-6" />
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
