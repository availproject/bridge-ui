import { TransactionStatus } from "@/types/common";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
    txnStatus: TransactionStatus
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({txnStatus} : StatusBadgeProps) => {
  return (
        <Badge className="flex-row items-center justify-center space-x-2 bg-[#24262f]">
          <p className="font-thicccboisemibold whitespace-nowrap">
            {txnStatus === "BRIDGED"
              ? `In Progress`
              : txnStatus.charAt(0) + txnStatus.toLocaleLowerCase().slice(1)}
          </p>
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                txnStatus === "INITIATED"
                  ? "bg-yellow-600"
                  : `${
                      txnStatus === "PENDING" ? "bg-blue-600" : "bg-orange-500"
                    }`
              } opacity-75`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2  ${
                txnStatus === "INITIATED"
                  ? "bg-yellow-600"
                  : `${
                      txnStatus === "PENDING" ? "bg-blue-600" : "bg-orange-500"
                    }`
              }`}
            ></span>
          </span>
        </Badge>
  );
}


