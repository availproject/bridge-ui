import { LoadingButton } from "@/components/ui/loadingbutton";
import useSubmitTxnState from "@/hooks/common/useSubmitTxnState";
import { useCommonStore } from "@/stores/common";
import { useState } from "react";
import { RxArrowTopRight } from "react-icons/rx";
import { isLiquidityBridge, isWormholeBridge } from "./utils";

export default function ReviewButton() {
  const [transactionInProgress, setTransactionInProgress] =
    useState<boolean>(false);

  const {
    fromChain,
    toChain,
    reviewDialog: { onOpenChange: setShowReviewModal },
  } = useCommonStore();
  const { buttonStatus, isDisabled } = useSubmitTxnState(transactionInProgress);

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setShowReviewModal(true);
  };

  return (
    <>
      <LoadingButton
        variant="primary"
        onClick={handleReview}
        disabled={isDisabled}
        className="!rounded-xl w-full !text-[15px] !py-8 max-md:mb-4 font-ppmori max-md:mt-4"
      >
        {buttonStatus}
      </LoadingButton>

      {isWormholeBridge(`${fromChain}-${toChain}`) && (
        <p className="w-full text-white text-opacity-70 text-center text-xs">
          Using Third Party Wormhole Bridge{" "}
          <RxArrowTopRight className="inline-block h-4 w-3" />
        </p>
      )}
      {isLiquidityBridge(`${fromChain}-${toChain}`) && (
        <p className=" text-white text-opacity-70 text-center text-xs ">
          <span className="flex-row justify-center items-center gap-1">
            Only amounts between 1 to 5000 AVAIL allowed for beta
          </span>
        </p>
      )}
    </>
  );
}
