import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCommonStore } from "@/stores/common";
import { getHref } from "@/utils/common";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";


export const SuccessDialog = () => {
  const { successDialog } = useCommonStore();
  const { isOpen, onOpenChange, claimDialog, details } = successDialog;

  const getTitle = () => claimDialog ? "Claim Submitted" : "Transaction Submitted";
  const getMessage = () => claimDialog ? (
    <>
      Your <span className="text-white">claim transaction</span> was successfully 
      submitted to the chain. Your funds will be deposited to the destination account, 
      generally within <span className="text-white italics">~15-30 minutes.</span>
    </>
  ) : (
    <>
      Your <span className="text-white">bridge transaction</span> was successfully 
      submitted to the chain. Check back in <span className="text-white italics">~2 hours</span> to 
      claim funds on the destination chain.
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#252831] !border-0">
        <DialogHeader>
          <DialogTitle className="font-thicccboisemibold text-white text-2xl mb-2">
            {getTitle()}
          </DialogTitle>
          <div className="border-b border border-white border-opacity-20"></div>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center !space-x-3 mt-2">
          <div className="w-[100%] h-40 mx-auto rounded-xl bg-black flex flex-col items-center justify-center">
            <FaCheckCircle className="mr-4 h-10 w-10" color="0BDA51" />
          </div>
          <div className="flex flex-col space-y-2">
            <p className="font-ppmori text-white text-sm text-opacity-60 mt-4">
              {getMessage()}
              <br />
              You can close this tab in the meantime, or initiate another transfer.
            </p>
          </div>
        </div>
        <DialogFooter className="sm:justify-start mt-1">
          <DialogClose asChild>
            <div className="w-full flex flex-col items-center justify-center space-y-2">
              <Link
                target="_blank"
                aria-disabled={!details}
                href={details ? getHref(details.chain, details.hash) : "#transactions"}
                className="w-full !border-0"
              >
                <Button type="button" variant="primary" className="w-full !border-0">
                  View on Explorer <ArrowUpRight className="h-3 w-6" />
                </Button>
              </Link>
              <a
                href="https://avail-project.notion.site/159e67c666dd811c8cf5e13903418d78"
                className="text-white text-opacity-70 underline mx-auto text-sm"
                target="_blank"
              >
                Submit feedback?
              </a>
            </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};