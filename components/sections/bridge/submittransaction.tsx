import { LoadingButton } from "@/components/ui/loadingbutton";
import useBridge from "@/hooks/useBridge";
import useTransactionButtonState from "@/hooks/useTransactionButtonState";
import { useCommonStore } from "@/stores/common";
import { Chain } from "@/types/common";
import { validAddress } from "@/utils/common";
import BigNumber from "bignumber.js";
import { useState } from "react";

export default function SubmitTransaction() {
  const [transactionInProgress, setTransactionInProgress] =
  useState<boolean>(false);

const {
  fromChain,
  toChain,
  fromAmount,
  toAddress,
  successDialog: {
    onOpenChange: setOpenDialog,
    setDetails,
  },
  errorDialog: {
    onOpenChange: setErrorOpenDialog,
    setError,
  },
} = useCommonStore();

const { initEthToAvailBridging, initAvailToEthBridging } = useBridge();
const { buttonStatus, isDisabled } =
  useTransactionButtonState(transactionInProgress);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const fromAmountAtomic = new BigNumber(fromAmount)
      .multipliedBy(new BigNumber(10).pow(18))
      .toString(10);

    if (toAddress === undefined || !validAddress(toAddress, toChain))
      throw new Error("Please enter a valid address");

    if (fromChain === Chain.ETH) {
      setTransactionInProgress(true);

      const blockhash = await initEthToAvailBridging({
        atomicAmount: fromAmountAtomic,
        destinationAddress: toAddress!,
      });

      setDetails({
        chain: Chain.ETH,
        hash: blockhash,
      });
      setOpenDialog(true);
    } else if (fromChain === Chain.AVAIL) {
      setTransactionInProgress(true);
      const init = await initAvailToEthBridging({
        atomicAmount: fromAmountAtomic,
        destinationAddress: toAddress!,
      });

      if (init.txHash !== undefined) {
      setDetails({
        chain: Chain.AVAIL,
        hash: init.txHash,
      });
        setOpenDialog(true);
      }
    } 
    // else if (fromChain === Chain.BASE) {
    //   setTransactionInProgress(true);
    //   const init = await initAvailToEthBridging({
    //     atomicAmount: fromAmountAtomic,
    //     destinationAddress: toAddress!,
    //   });
    //   if (init.txHash !== undefined) {
    //     setAvailToEthHash(init.txHash);
    //     setOpenDialog(true);
    //   }
    // }

    setTransactionInProgress(false);
  } catch (error: any) {
    setTransactionInProgress(false);
    setError(error);
    setErrorOpenDialog(true); 
  }
};
  return (
    <LoadingButton
      variant="primary"
      loading={transactionInProgress}
      onClick={handleSubmit}
      className="!rounded-xl w-full !text-[15px] !py-8 max-md:mb-4 font-ppmori"
      disabled={isDisabled}
    >
      {buttonStatus}
    </LoadingButton>
  );
}
