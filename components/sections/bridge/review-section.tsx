import { Badge } from "@/components/ui/badge";
import React from "react";
import { LoadingButton } from "@/components/ui/loadingbutton";
import useZkBridge from "@/hooks/useZkBridge";
import useSubmitTxnState from "@/hooks/common/useSubmitTxnState";
import { SuccessDialog, useCommonStore } from "@/stores/common";
import { Chain } from "@/types/common";
import { validAddress } from "@/utils/common";
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
          };
        }
      }
      case ChainPairs.BASE_TO_AVAIL: {
        console.log("BASE TO AVAIL", fromAmountAtomic, toAddress);

        const init = await initERC20toAvailAutomaticBridging({
          ERC20Chain: Chain.BASE,
          atomicAmount: fromAmountAtomic,
          destinationAddress: toAddress!,
        });

        if (init.hash) {
          bridgeResult = {
            chain: Chain.BASE,
            hash: init.hash,
          };
        }
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
              <Details />
              <LoadingButton
                variant="primary"
                loading={transactionInProgress}
                onClick={handleSubmit}
                className="!rounded-xl w-full !text-[15px] !py-8 max-md:mb-4 font-ppmori max-md:mt-4"
                disabled={isDisabled}
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


const Details = () => {
  return (
    <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-gray-400">Destination Gas Fee ($)</span>
      <span className="text-white">1.66 Avail ($1.2)</span>
    </div>

    <div className="flex justify-between items-center">
      <span className="text-gray-400">Estimated Time</span>
      <span className="text-white">~5 minutes</span>
    </div>

    <div className="flex justify-between items-center">
      <span className="text-gray-400">Claim Type</span>
      <Badge variant={"avail"} className="text-white">
        Auto
      </Badge>
    </div>

    <div className="flex justify-between items-center pt-4">
      <span className="text-gray-400">User will recieve</span>
      <div className="text-right">
        <span className="text-2xl font-semibold text-white">11.34</span>
        <span className="text-gray-400 ml-2">Avail</span>
      </div>
    </div>
  </div>
  )
}