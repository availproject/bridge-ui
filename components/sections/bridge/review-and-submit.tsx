import { Badge } from "@/components/ui/badge";
import React, { useEffect } from "react";
import { LoadingButton } from "@/components/ui/loadingbutton";
import useZkBridge from "@/hooks/useZkBridge";
import useSubmitTxnState from "@/hooks/common/useSubmitTxnState";
import { SuccessDialog, useCommonStore } from "@/stores/common";
import { Chain } from "@/types/common";
import { fromBridgeHex, validAddress } from "@/utils/common";
import BigNumber from "bignumber.js";
import { useState } from "react";
import useWormHoleBridge from "@/hooks/wormhole/useWormHoleBridge";
import { ChainPairs } from "./types";
import { appConfig } from "@/config/default";
import { useBalanceStore } from "@/stores/balances";
import { useApi } from "@/stores/api";
import { useAvailAccount } from "@/stores/availwallet";
import { useAccount } from "wagmi";
import useLiquidityBridge from "@/hooks/useLiquidityBridge";
import { motion, AnimatePresence } from "framer-motion";
import { ReviewResponse, reviewTxn } from "@/services/bridgeapi";
import Loader from "@/components/common/loader";
import { parseAvailAmount } from "@/utils/parsers";
import { Clock } from "lucide-react";
import { isLiquidityBridge, isWormholeBridge } from "./utils";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [transactionInProgress, setTransactionInProgress] =
    useState<boolean>(false);

  const {
    fromChain,
    toChain,
    fromAmount,
    toAddress,
    successDialog,
    errorDialog: { onOpenChange: setErrorOpenDialog, setError },
    reviewDialog: { onOpenChange: setShowReviewModal, isOpen: reviewOpen },
    signatures
  } = useCommonStore();

  const { fetchBalance } = useBalanceStore();
  const { selected } = useAvailAccount();
  const { address: ethAddress } = useAccount();
  const { api } = useApi();
  const { initEthToAvailBridging, initAvailToEthBridging } = useZkBridge();
  const {
    initAvailToERC20AutomaticBridging,
    initERC20toAvailAutomaticBridging,
  } = useLiquidityBridge();
  const { initWormholeBridge } = useWormHoleBridge();
  const { buttonStatus, isDisabled } = useSubmitTxnState(transactionInProgress);
  const {dollarAmount} = useCommonStore();

  const [details, setDetails] = useState<ReviewResponse | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const _details = await reviewTxn(new BigNumber(fromAmount)
        .multipliedBy(new BigNumber(10).pow(18))
        .toString(10), fromChain);
        if (_details.isOk()) {
          setDetails(_details.value);
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [fromAmount, reviewOpen, fromChain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    successDialog.setClaimDialog(false);

    try {
      let bridgeResult: SuccessDialog["details"] | null = null;
      const chainPair = `${fromChain}-${toChain}` as const;

      const fromAmountAtomic = new BigNumber(fromAmount)
        .multipliedBy(new BigNumber(10).pow(18))
        .toString(10);

      if (toAddress === undefined || !validAddress(toAddress, toChain)) {
        throw new Error("Please enter a valid address");
      }

      setTransactionInProgress(true);

      switch (chainPair) {
        case ChainPairs.ETH_TO_AVAIL: {
          const blockhash = await initEthToAvailBridging({
            atomicAmount: fromAmountAtomic,
            destinationAddress: toAddress!,
          });
          bridgeResult = { chain: Chain.ETH, hash: blockhash };
          break;
        }
        case ChainPairs.AVAIL_TO_ETH: {
          const init = await initAvailToEthBridging({
            atomicAmount: fromAmountAtomic,
            destinationAddress: toAddress!,
          });
          if (init.txHash) {
            bridgeResult = { chain: Chain.AVAIL, hash: init.txHash };
          }
          break;
        }
        case ChainPairs.BASE_TO_ETH: {
          const init = await initWormholeBridge({
            whfrom: appConfig.config === "mainnet" ? "Base" : "BaseSepolia",
            whto: appConfig.config === "mainnet" ? "Ethereum" : "Sepolia",
            sendAmount: fromAmount,
            destinationAddress: toAddress!,
            switcher: Chain.BASE,
          });
          if (init) {
            bridgeResult = {
              chain: Chain.BASE,
              hash: init[1] ? init[1].txid : init[0].txid,
              isWormhole: true,
            };
          }
          break;
        }
        case ChainPairs.ETH_TO_BASE: {
          const init = await initWormholeBridge({
            whfrom: appConfig.config === "mainnet" ? "Ethereum" : "Sepolia",
            whto: appConfig.config === "mainnet" ? "Base" : "BaseSepolia",
            sendAmount: fromAmount,
            destinationAddress: toAddress!,
            switcher: Chain.ETH,
          });
          if (init) {
            bridgeResult = {
              chain: Chain.ETH,
              hash: init[1] ? init[1].txid : init[0].txid,
              isWormhole: true,
            };
          }
          break;
        }
        case ChainPairs.AVAIL_TO_BASE: {
          console.log("AVAIL TO BASE");
          const init = await initAvailToERC20AutomaticBridging({
            ERC20Chain: Chain.BASE,
            atomicAmount: fromAmountAtomic,
            destinationAddress: toAddress!,
          });

          if (init.hash) {
            bridgeResult = {
              chain: Chain.AVAIL,
              hash: init.hash,
              id: init.id,
              isLiquidityBridge: true
            };
          }
          break;
        }
        case ChainPairs.BASE_TO_AVAIL: {

          const init = await initERC20toAvailAutomaticBridging({
            ERC20Chain: Chain.BASE,
            atomicAmount: fromAmountAtomic,
            destinationAddress: toAddress!,
          });

          if (init.hash) {
            bridgeResult = {
              chain: Chain.BASE,
              hash: init.hash,
              id: init.id,
              isLiquidityBridge: true
            };
          }
          break;
        }
      }
      if (bridgeResult) {
        successDialog.setDetails(bridgeResult);
        successDialog.onOpenChange(true);
      }
    } catch (error: any) {
      console.error(error);
      setError(error);
      setErrorOpenDialog(true);
    } finally {
      setTransactionInProgress(false);
      onClose();
      await fetchBalance(
        fromChain === Chain.AVAIL ? selected?.address! : ethAddress!,
        fromChain,
        api
      );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-20 mx-auto w-screen max-sm:rounded-none max-sm:!border-x-0 !max-w-xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-2 left-0 right-0 flex justify-center"
          >
            <div className="bg-[#2B3042] !rounded-b-xl w-full p-6 space-y-6 border-t-2 border-white border-opacity-15">
              <div className="flex justify-between items-center">
                <h2 className="text-xl text-white font-medium font-ppmori">
                  Review Transaction Details
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {details ? (
                <div className="space-y-1">
                  {isLiquidityBridge(`${fromChain}-${toChain}`) &&  <div className="flex justify-between items-center">
                    <span className="text-gray-400">
                      Destination Gas Fee ($)
                    </span>
                    <span className="text-white">
                  {parseAvailAmount(fromBridgeHex(details.fee),18)}
                      {" "} AVAIL
                      (${dollarAmount * Number(parseAvailAmount(fromBridgeHex(details.fee),18, 6)) })
                    </span>
                  </div>}
                 

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estimated Time</span>
                    <div className="flex items-center space-x-2 pb-1">
                      <Clock className="h-4 w-4 text-white" />
                      <span className="text-white">
                        {isWormholeBridge(`${fromChain}-${toChain}`) ? '~20 minutes' : 
                        isLiquidityBridge(`${fromChain}-${toChain}`) ? '~5 minutes' : '~2 hours'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Transaction Type</span>
                    <Badge variant={"avail"} className="text-white">
                    {isLiquidityBridge(`${fromChain}-${toChain}`) || isWormholeBridge(`${fromChain}-${toChain}`) ? 'Auto' : 'Manual'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-gray-400">User will receive</span>
                    <div className="text-right">
                      <span className="text-2xl font-semibold text-white">
                        {
                          parseAvailAmount(
                              new BigNumber(fromAmount).multipliedBy(10 ** 18)
                                .minus(fromBridgeHex(details.fee))
                                .toString(),
                              18,
                              6
                            )
                          }
                      </span>
                      <span className="text-gray-400 ml-2">AVAIL</span>
                    </div>
                  </div>
                </div>
              ) : <Loader/>}
              <LoadingButton
                variant="primary"
                loading={transactionInProgress}
                onClick={handleSubmit}
                className="!rounded-xl w-full !text-[15px] !py-8 max-md:mb-4 font-ppmori max-md:mt-4"
                disabled={isDisabled}
                signatures={signatures}
              >
                {buttonStatus}
              </LoadingButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransactionModal;
