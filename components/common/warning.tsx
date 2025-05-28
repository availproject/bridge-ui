import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RxExclamationTriangle } from "react-icons/rx";
import { useState, useEffect } from "react";
import { useCommonStore } from "@/stores/common";

export const WarningDialog = () => {
  const { warningDialog } = useCommonStore();
  const { isOpen, onOpenChange, onReject, onRetry } = warningDialog;
  const [timeLeft, setTimeLeft] = useState(5);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  useEffect(() => {
    if (isOpen && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsButtonEnabled(true);
    }
  }, [isOpen, timeLeft]);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(5);
      setIsButtonEnabled(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReject = () => {
    onReject?.();
    onOpenChange(false);
  };

  const handleRetry = () => {
    onRetry?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        onEscapeKeyDown={(event) => {
          event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
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
                Your funds will be stuck for 7 days if
                <br /> you reject this signature!
              </p>
            </div>

            <span>
              <p className="text-white/70 text-center w-[90%] mx-auto text-sm mt-4">
                If you proceed with rejection, manual refunds will be processed
                on the source chain after 7 days. You will need to reach out on
                <span className="font-bold"> Discord for assistance.</span>
              </p>
            </span>

            <div className="flex gap-4 pt-8">
              <button
                onClick={handleReject}
                disabled={!isButtonEnabled}
                className={`w-full rounded-lg font-thicccboibold px-12 py-3 bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors duration-300 relative overflow-hidden ${!isButtonEnabled && "opacity-50 cursor-not-allowed !px-10"}`}
              >
                {!isButtonEnabled && (
                  <div
                    className="absolute inset-0 bg-black bg-opacity-30 transition-all duration-1000"
                    style={{
                      right: `${(timeLeft / 5) * 100}%`,
                    }}
                  />
                )}
                <span className="relative z-10">
                  Reject {!isButtonEnabled && `(${timeLeft}s)`}
                </span>
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 rounded-lg px-12 font-thicccboibold py-3 bg-green-900/40 text-green-400 hover:bg-green-900/60 transition-colors duration-300"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 text-center">
          <div className="w-full">
            <a
              href="https://avail-project.notion.site/159e67c666dd811c8cf5e13903418d78"
              className="text-white text-opacity-70 underline mx-auto text-sm"
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
