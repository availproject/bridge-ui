import { LoadingButton } from "@/components/ui/loadingbutton";
import useBridge from "@/hooks/useBridge";
import useSubmitTxnState from "@/hooks/common/useSubmitTxnState";
import { useCommonStore } from "@/stores/common";
import { Chain } from "@/types/common";
import { validAddress } from "@/utils/common";
import BigNumber from "bignumber.js";
import { use, useState } from "react";
import useWormHoleBridge from "@/hooks/wormhole/useWormHoleBridge";
import { ChainPairs } from "./types";
import { appConfig } from "@/config/default";
import { RxArrowTopRight } from "react-icons/rx";
import { useBalanceStore } from "@/stores/balances";
import { useApi } from "@/stores/api";
import { useAvailAccount } from "@/stores/availwallet";
import { useAccount } from "wagmi";

export default function SubmitTransaction() {
  const [transactionInProgress, setTransactionInProgress] =
    useState<boolean>(false);

  const {
    fromChain,
    toChain,
    fromAmount,
    toAddress,
    successDialog: { onOpenChange: setOpenDialog, setDetails },
    errorDialog: { onOpenChange: setErrorOpenDialog, setError },
  } = useCommonStore();

  const { fetchBalance } = useBalanceStore();
  const { selected } = useAvailAccount();
  const { address: ethAddress } = useAccount();
  const { api } = useApi();
  const { initEthToAvailBridging, initAvailToEthBridging } = useBridge();
  const { initWormholeBridge } = useWormHoleBridge();
  const { buttonStatus, isDisabled } = useSubmitTxnState(transactionInProgress);

  const isWormholeBridge = (chainPair: string) =>
    chainPair === ChainPairs.BASE_TO_ETH ||
    chainPair === ChainPairs.ETH_TO_BASE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let bridgeResult;
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
            };
          }
          break;
        }
        default:
          throw new Error("Unsupported chain combination");
      }

      if (bridgeResult) {
        setDetails(bridgeResult);
        setOpenDialog(true);
      }
    } catch (error: any) {
      console.error(error);
      setError(error);
      setErrorOpenDialog(true);
    } finally {
      setTransactionInProgress(false);
      await fetchBalance(
        fromChain === Chain.AVAIL ? selected?.address! : ethAddress!,
        fromChain,
        api
      );
    }
  }

    return (
      <>
        <LoadingButton
          variant="primary"
          loading={transactionInProgress}
          onClick={handleSubmit}
          className="!rounded-xl w-full !text-[15px] !py-8 max-md:mb-4 font-ppmori"
          disabled={isDisabled}
        >
          {buttonStatus}
        </LoadingButton>
        {isWormholeBridge(`${fromChain}-${toChain}`) && (
          <p className="w-full  text-white text-opacity-70 text-center text-xs">
            Using Third Party Wormhole Bridge{" "}
            <RxArrowTopRight className="inline-block h-4 w-3" />
          </p>
        )}
      </>
    );
  };

