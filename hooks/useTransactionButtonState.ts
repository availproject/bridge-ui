import { useAvailAccount } from "@/stores/availWalletHook";
import { useCommonStore } from "@/stores/common";
import { Chain } from "@/types/common";
import { validAddress } from "@/utils/common";
import { Logger } from "@/utils/logger";
import { useMemo } from "react";
import { useAccount } from "wagmi";

export default function useTransactionButtonState(
  transactionInProgress: boolean
) {
  const account = useAccount();
  const { selected } = useAvailAccount();
  const {
    fromChain,
    dollarAmount,
    toChain,
    fromAmount,
    toAddress,
    ethBalance,
    availBalance,
  } = useCommonStore();

  const isWalletConnected = useMemo(() => {
    if (fromChain === Chain.ETH) {
      return account?.address && true;
    }
    if (fromChain === Chain.AVAIL) {
      return selected?.address && true;
    }
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

  const isValidToAddress = useMemo( () => {
    if (fromChain === Chain.AVAIL) {
      return Boolean(
        (account?.address) || (toAddress && validAddress(toAddress, Chain.ETH))
      );
    } else {
      return Boolean(
        (selected?.address) || (toAddress && validAddress(toAddress, Chain.AVAIL))
      );
    }
  }, [toAddress, fromChain, selected?.address, account?.address]);

  const hasInsufficientBalance = useMemo(() => {
    if (!fromAmount || isNaN(fromAmount)) return false;

    const amount = parseFloat(fromAmount?.toString()) * 10 ** 18;
    if (isNaN(amount)) return false;

    const balanceMap = {
      [Chain.ETH]: ethBalance,
      [Chain.AVAIL]: availBalance,
    };

    const currentBalance = balanceMap[fromChain];
    if (currentBalance === undefined || currentBalance === null) return true;

    return parseFloat(currentBalance) < amount;
  }, [ethBalance, availBalance, fromAmount, fromChain]);

  const buttonStatus = useMemo(() => {
    if (!isWalletConnected) {
      return "Connect Wallet";
    }
    if (transactionInProgress) {
      return "Transaction in progress";
    }
    if (isInvalidAmount) {
      return "Enter Amount";
    }
    if (!isValidToAddress) {
      return "Invalid Receiver Details";
    }

    if (hasInsufficientBalance) {
      return "Insufficient Balance";
    }
    return `Initiate bridge from ${
      fromChain.charAt(0).toUpperCase() + fromChain.slice(1).toLowerCase()
    } to ${toChain.charAt(0).toUpperCase() + toChain.slice(1).toLowerCase()}`;
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

  const availAmountToDollars: number = useMemo(() => {
    return fromAmount ? fromAmount * dollarAmount : 0;
  }, [fromAmount, dollarAmount]);

  return { buttonStatus, isDisabled, availAmountToDollars };
}
