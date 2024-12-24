import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RxCrossCircled } from "react-icons/rx";
import { Copy } from "lucide-react";
import { useState } from "react";
import { parseError } from "@/utils/parsers";
import { useCommonStore } from "@/stores/common";

export const ErrorDialog = () => {

  const { errorDialog } = useCommonStore();
  const { isOpen, onOpenChange, error, claimDialog } = errorDialog;
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    if (error) {
      navigator.clipboard.writeText(error.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const errorMessage = error?.toString() || "Unknown error occurred";
  const parsedError = parseError(errorMessage);
  const isGenericError =
    parsedError === errorMessage || parsedError === "Something went wrong!";

  const truncatedError =
    errorMessage.length > 150
      ? errorMessage.slice(0, 60) + "..."
      : errorMessage;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#252831] !border-0 !overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-thicccboisemibold text-white text-2xl mb-2">
            Transaction Failed
          </DialogTitle>
          <div className="border-b border border-white border-opacity-20"></div>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center mt-2">
          <div className="w-full h-20 mx-auto rounded-xl flex flex-col items-center justify-center">
            <RxCrossCircled className="h-16 w-16" color="BB3636" />
          </div>

          <div className="flex flex-col space-y-2 items-center justify-center">
            <div className="font-thicccboisemibold text-center text-white text-xl mt-3 w-[90%]">
              {!isGenericError ? (
                parsedError
              ) : (
                <p>
                  Uh Oh! We ran into an
                  <br /> unexpected error
                </p>
              )}
            </div>

            <span>
              <p className="text-white/70 text-center w-[80%] mx-auto text-sm mt-4">
                {claimDialog && (
                  <>
                    <span>Don&#39;t fret, yours funds are safe. </span>
                    <br className="mb-2 pb-2" />
                  </>
                )}{" "}
                in the meanwhile you can{" "}
                <a
                  className="text-white underline"
                  target="_blank"
                  href="https://avail-project.notion.site/Avail-Bridge-FAQs-13de67c666dd800ea9b9fd4d8935bd94"
                >
                  visit our FAQs
                </a>{" "}
                for common issues, or retry after a while.
              </p>
            </span>

            {isGenericError && (
              <div className="!max-w-[80%] !mt-6 bg-black/50 rounded-lg p-3">
                <div className="relative">
                  <p className="text-white/70 text-sm break-words overflow-hidden text-ellipsis max-h-[4.5rem] overflow-y-auto pr-4 w-full">
                    {truncatedError}
                  </p>
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-0 top-0 p-1 rounded hover:bg-white/10 transition-colors"
                    aria-label="Copy error message"
                  >
                    <Copy
                      size={16}
                      className={`${
                        copied ? "text-green-500" : "text-white/70"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-4 text-center">
          <DialogClose asChild>
            <div className="w-full">
              <a
                href="https://avail-project.notion.site/159e67c666dd811c8cf5e13903418d78"
                className="text-white underline mx-auto text-sm"
                target="_blank"
              >
                Found a bug? Submit feedback here
              </a>
            </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorDialog;