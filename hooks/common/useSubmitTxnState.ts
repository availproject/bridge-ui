import { useAvailAccount } from "@/stores/availwallet";
import { useBalanceStore } from "@/stores/balances";
import { useCommonStore } from "@/stores/common";
import { Chain } from "@/types/common";
import { validAddress } from "@/utils/common";
import BigNumber from "bignumber.js";
import { useMemo } from "react";
import { useAccount } from "wagmi";

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
    return (
      fromAmount === undefined ||
      fromAmount === null ||
      isNaN(amount) ||
      amount <= 0
    );
  }, [fromAmount]);

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
  }, [toAddress, fromChain, selected?.address, account?.address]);

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
   
  }, [
    isWalletConnected,
    isValidToAddress,
    transactionInProgress,
    isInvalidAmount,
    hasInsufficientBalance,
    fromChain,
    toChain,
  ]);

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
