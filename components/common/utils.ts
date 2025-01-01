import { TxnLifecyle } from "@/hooks/common/useTrackTxnStatus";

export const getStepStatus = (step: number, status: TxnLifecyle) => {
    if (step === 1) {
      return status === "submitted" ? "processing" : "done";
    }
    if (step === 2) {
      return status === "included"
        ? "processing"
        : status === "finalised"
        ? "done"
        : "waiting";
    }
    return "waiting";
  };