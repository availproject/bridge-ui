import { useAvailAccount } from "@/stores/availwallet";
import { useBalanceStore } from "@/stores/balances";
import { useCommonStore } from "@/stores/common";
import { Chain } from "@/types/common";
import { validAddress } from "@/utils/common";
import BigNumber from "bignumber.js";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { appConfig } from "@/config/default";
import { isLiquidityBridge } from "@/components/sections/bridge/utils";

export default function useSubmitTxnState(
  transactionInProgress: boolean
) {
  const account = useAccount();
  const { selected } = useAvailAccount();
  const { fromChain, toChain, fromAmount, toAddress, reviewDialog } = useCommonStore();
  const { balances } = useBalanceStore();

  const isWalletConnected = useMemo(() => {
    if (fromChain === Chain.AVAIL) {
      return selected?.address && true;
    } 
      return account.address && true;
  }, [account.address, selected?.address, fromChain]);

  const isInvalidAmount = useMemo(() => {
    const amount = parseFloat(fromAmount?.toString());

    
    if (isLiquidityBridge(`${fromChain}-${toChain}`)) {
      return (
        fromAmount === undefined ||
        fromAmount === null ||
        isNaN(amount) ||
        amount < appConfig.bridgeLimits.baseAvail.min ||
        amount > appConfig.bridgeLimits.baseAvail.max
      );
    }
    
    return (
      fromAmount === undefined ||
      fromAmount === null ||
      isNaN(amount) ||
      amount <= 0
    );
  }, [fromAmount, fromChain, toChain]);

  const isValidToAddress = useMemo(() => {
    switch (toChain) {
      case Chain.AVAIL:
        return Boolean(toAddress && validAddress(toAddress, Chain.AVAIL));
      case Chain.BASE:
        return Boolean(toAddress && validAddress(toAddress, Chain.BASE));
      case Chain.ETH:
        return Boolean(toAddress && (validAddress(toAddress, Chain.ETH)));
      default:
        return false;
    }
  }, [toChain, toAddress]);

  const hasInsufficientBalance = useMemo(() => {
    if (!fromAmount || isNaN(Number(fromAmount))) return false;

    const reservedAmount = fromChain === Chain.AVAIL ? 0.25 : 0; // .25 AVAIL ONLY WHEN FROM CHAIN IS AVAIL

    const amount = parseFloat(fromAmount?.toString()) + reservedAmount;
    if (isNaN(amount)) return false;

    const currentBalance = balances[fromChain];
    if (currentBalance.error || currentBalance.status === "loading") return true;

    return new BigNumber(currentBalance.value).lt(amount);
  }, [balances, fromAmount, fromChain]);

  const buttonStatus = useMemo(() => {
    if (!isWalletConnected) {
      return "Connect Wallet";
    }
    if (transactionInProgress) {
      return "Transaction in progress";
    }
    if (isInvalidAmount) {
      if (isLiquidityBridge(`${fromChain}-${toChain}`) && fromAmount && parseFloat(fromAmount.toString()) > 0) {
        return `Enter Amount to Bridge`;
      }
      return "Enter Amount to Bridge";
    }
    if (!isValidToAddress) {
      return "Oops, that receiver address looks wrong";
    }

    if (hasInsufficientBalance) {
      return "Insufficient Balance";
    }
    if(reviewDialog.isOpen) {
      return `Initiate bridge from ${
        fromChain.charAt(0).toUpperCase() + fromChain.slice(1).toLowerCase()
      } to ${toChain.charAt(0).toUpperCase() + toChain.slice(1).toLowerCase()}`;
    }

    return "Review and Confirm Transaction";
   
  }, [isWalletConnected, transactionInProgress, isInvalidAmount, isValidToAddress, hasInsufficientBalance, reviewDialog.isOpen, fromChain, toChain, fromAmount]);

  const isDisabled = useMemo(() => {
    return (
      transactionInProgress ||
      isInvalidAmount ||
      hasInsufficientBalance ||
      !isWalletConnected ||
      !isValidToAddress
    );
  }, [
    transactionInProgress,
    isInvalidAmount,
    hasInsufficientBalance,
    isWalletConnected,
    isValidToAddress,
  ]);

  return { buttonStatus, isDisabled };
}
