import { CheckCircle2, Loader2 } from "lucide-react";
import { badgeVariants } from "../ui/badge";
import { useCommonStore } from "@/stores/common";

export default function PendingTxnsBadge() {
  const { pendingTransactionsNumber, readyToClaimTransactionsNumber } =
    useCommonStore();

  return (
    <div className="hidden md:flex">
      <div className={badgeVariants({ variant: "avail" })}>
        {pendingTransactionsNumber > 0 ? (
          <>
            <Loader2 className={`h-4 w-4 animate-spin`} />
            <p className="!text-left">
              {" "}
              {pendingTransactionsNumber} Pending{" "}
              <span className="mx-2">|</span> {readyToClaimTransactionsNumber}{" "}
              Claim Ready
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className={`h-4 w-4`} />
            <p className="!text-left"> No Pending Claims</p>
          </>
        )}
      </div>
    </div>
  );
}
