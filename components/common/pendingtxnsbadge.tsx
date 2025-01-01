import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { badgeVariants } from "../ui/badge";
import useTransactions from "@/hooks/useTransactions";

export default function PendingTxnsBadge() {

  const { pendingTransactions } = useTransactions()

  return (
    <div className="hidden md:flex">
      <div className={badgeVariants({ variant: "avail" })}>
        {pendingTransactions.length > 0 ? (
          <>
            <AlertTriangle className={`h-4 w-4`} />
            <p className="!text-left">
              {" "}
              {pendingTransactions.filter((txn) => txn.status === "READY_TO_CLAIM").length} Ready to Claim{" "}
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className={`h-4 w-4`} />
            <p className="!text-left">No Pending Claims</p>
          </>
        )}
      </div>
    </div>
  );
}
