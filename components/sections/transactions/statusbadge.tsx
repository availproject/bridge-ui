import { TransactionStatus } from "@/types/common";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
    txnStatus: TransactionStatus
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({txnStatus} : StatusBadgeProps) => {
  const formatStatus = (status: TransactionStatus) => {
    if (status === "BRIDGED") return "In Progress";
    if (status === "READY_TO_CLAIM") return "Ready To Claim";
    if (status === "CLAIM_PENDING") return "Claim Pending";
    return status.charAt(0) + status.toLowerCase().slice(1);
  };

  return (
        <Badge className="flex-row items-center justify-center space-x-2 bg-[#24262f]">
          <p className="font-thicccboisemibold whitespace-nowrap">
            {formatStatus(txnStatus)}
          </p>
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                txnStatus === "INITIATED"
                  ? "bg-yellow-600"
                  : `${
                      txnStatus === "PENDING" 
                        ? "bg-blue-600" 
                        : txnStatus === "ERROR"
                          ? "bg-red-600"
                          : "bg-orange-500"
                    }`
              } opacity-75`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2  ${
                txnStatus === "INITIATED"
                  ? "bg-yellow-600"
                  : `${
                      txnStatus === "PENDING" 
                        ? "bg-blue-600" 
                        : txnStatus === "ERROR"
                          ? "bg-red-600"
                          : "bg-orange-500"
                    }`
              }`}
            ></span>
          </span>
        </Badge>
  );
}


