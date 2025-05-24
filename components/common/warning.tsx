import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RxExclamationTriangle } from "react-icons/rx";
import { useState } from "react";
import { parseError } from "@/utils/parsers";
import { useCommonStore } from "@/stores/common";
import { Button } from "@/components/ui/button";

export const WarningDialog = () => {
  const { warningDialog, successDialog } = useCommonStore();
  const { isOpen, onOpenChange, warning, onReject, onRetry } = warningDialog;
  const { claimDialog } = successDialog;
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleReject = () => {
    onReject?.();
    onOpenChange(false);
  };

  const handleRetry = () => {
    onRetry?.();
    onOpenChange(false);
  };

  const copyToClipboard = () => {
    if (warning) {
      navigator.clipboard.writeText(warning.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const warningMessage = warning?.toString() || "Unknown warning occurred";
  const parsedWarning = parseError(warningMessage);
  const isGenericWarning =
    parsedWarning === warningMessage ||
    parsedWarning === "Something went wrong!";

  const truncatedWarning =
    warningMessage.length > 150
      ? warningMessage.slice(0, 60) + "..."
      : warningMessage;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-md bg-[#252831] !border-0 !overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="font-thicccboisemibold text-white text-2xl mb-2">
            Transaction Warning
          </DialogTitle>
          <div className="border-b border border-white border-opacity-20"></div>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center mt-2">
          <div className="w-full h-20 mx-auto rounded-xl flex flex-col items-center justify-center">
            <RxExclamationTriangle className="h-16 w-16" color="#FBBF24" />
          </div>

          <div className="flex flex-col space-y-2 items-center justify-center">
            <div className="font-thicccboisemibold text-center text-white text-xl mt-3 w-[90%]">
              <p>
                Funds will be stuck if
                <br /> you reject this signature
              </p>
            </div>

            <span>
              <p className="text-white/70 text-center w-[90%] mx-auto text-sm mt-4">
                Rejecting this signature will result in your funds being stuck.
                If you proceed with rejection, manual refunds will be processed
                on the source chain after 7 days. You will need to reach out on
                Discord for assistance.
              </p>
            </span>

            <div className="flex gap-4 mt-6 w-full">
              <Button
                onClick={handleReject}
                className="flex-1 bg-[#BB3636] hover:bg-[#AA2525] text-white font-thicccboisemibold"
              >
                Reject
              </Button>
              <Button
                onClick={handleRetry}
                className="flex-1 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-thicccboisemibold"
              >
                Sign
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 text-center">
          <div className="w-full">
            <a
              href="https://avail-project.notion.site/159e67c666dd811c8cf5e13903418d78"
              className="text-white underline mx-auto text-sm"
              target="_blank"
            >
              Found a bug? Submit feedback here
            </a>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WarningDialog;
