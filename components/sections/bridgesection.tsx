/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { HiOutlineSwitchVertical } from "react-icons/hi";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RiLoopLeftFill } from "react-icons/ri";
import { useEffect, useState } from "react";
import Avail from "../wallets/avail";
import Eth from "../wallets/eth";
import {
  _getBalance,
  showFailedMessage,
  showSuccessMessage,
  validAddress,
} from "@/utils/common";
import { useAccount } from "wagmi";
import { useAvailAccount } from "@/stores/availWalletHook";
import { useCommonStore } from "@/stores/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Chain, TransactionStatus } from "@/types/common";
import useBridge from "@/hooks/useBridge";
import { toast } from "@/components/ui/use-toast";
import { parseError } from "@/utils/parseError";
import BigNumber from "bignumber.js";
import { badgeVariants } from "../ui/badge";
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  InfoIcon,
  Loader2,
} from "lucide-react";
import useTransactions from "@/hooks/useTransactions";
import { parseAmount } from "@/utils/parseAmount";
import { LoadingButton } from "../ui/loadingbutton";
import useTransactionButtonState from "@/hooks/useTransactionButtonState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Checkbox } from "../ui/checkbox";
import { RxCrossCircled } from "react-icons/rx";
import TransactionSection from "./transactionsection";
import { FaCheckCircle } from "react-icons/fa";
import { pollWithDelay } from "@/utils/poller";
import { appConfig } from "@/config/default";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Input } from "../ui/input";
import { transferAvailForGas } from "@/services/vectorpallet";

const formSchema = z
  .object({
    availAddress: z.string().optional(),
    ethAddress: z.string().optional(),
  })
  .refine((data) => data.availAddress || data.ethAddress, {
    message: "Add an address and Retry fetching",
  });

export default function BridgeSection() {
  const account = useAccount();
  const {
    fromChain,
    setFromChain,
    toChain,
    setToChain,
    setFromAmount,
    setToAddress,
  } = useCommonStore();
  const { selected } = useAvailAccount();
  const {
    pendingTransactionsNumber,
    setPendingTransactionsNumber,
    readyToClaimTransactionsNumber,
    setReadyToClaimTransactionsNumber,
  } = useCommonStore();
  const { fetchTransactions } = useTransactions();
  const { pendingTransactions } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [ethBalance, setEthBalance] = useState<string | undefined | null>(null);
  const [availBalance, setAvailBalance] = useState<string | undefined | null>(
    null
  );
  const [availAddress, setAvailAddress] = useState<string>("");
  const [ethAddress, setEthAddress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const {hasInsufficientBalance} = useTransactionButtonState(ethBalance, availBalance, false);
  const handleChangeAvailAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvailAddress(e.target.value);
  };

  const handleChangeEthAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEthAddress(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      formSchema.parse({ availAddress, ethAddress });
      setError(null);
      // Handle valid input
      console.log("Valid input:", { availAddress, ethAddress });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    }
  };

  const appInit = async () => {
    console.log(availAddress, ethAddress);
    pollWithDelay(
      fetchTransactions,
      [
        {
          availAddress: availAddress,
          ethAddress: ethAddress,
        },
      ],
      appConfig.bridgeIndexerPollingInterval,
      () => true
    );
  };
  useEffect(() => {
    appInit();
  }, [availAddress, ethAddress]);

  useEffect(() => {
    setPendingTransactionsNumber(
      pendingTransactions.filter(
        (transaction) => transaction.status !== TransactionStatus.CLAIMED
      ).length
    );
    setReadyToClaimTransactionsNumber(
      pendingTransactions.filter(
        (transaction) => transaction.status == TransactionStatus.READY_TO_CLAIM
      ).length
    );
  }, [pendingTransactions]);

  useEffect(() => {
    (async () => {
      if (account.address) {
        const result = await _getBalance(Chain.ETH, undefined, account.address);
        setEthBalance(result);
      } else {
        setEthBalance(undefined);
      }
      if (selected?.address) {
        const result = await _getBalance(Chain.AVAIL, selected?.address);
        setAvailBalance(result);
      } else {
        setAvailBalance(undefined);
      }
    })();
  }, [account.address, selected?.address]);

  useEffect(() => {
    document
      .getElementById("transactions")
      ?.setAttribute(
        "style",
        `height:${document.getElementById("bridge")?.clientHeight}px`
      );
  }, []);


  return (
    <div className="text-white w-full my-4">
      <Tabs
        defaultValue="transactions"
        id="container"
        className="section_bg p-2 w-[90vw] sm:w-[70vw] lg:w-[55vw] xl:w-[45vw] "
      >
        <TabsList className="flex flex-row items-start justify-start bg-transparent !border-0 p-2 mb-6 mx-2 mt-1">
          <div className="flex flex-row pb-[2vh] items-center justify-between">
            <h1 className="font-ppmori items-center flex flex-row space-x-2 text-white text-opacity-80 text-2xl w-full ">
              <span className="relative flex flex-row items-center justify-center">
                <TabsTrigger
                  value="transactions"
                  className="relative font-ppmori text-lg data-[state=active]:bg-inherit data-[state=active]:bg-opacity-100 data-[state=active]:border-b !rounded-none"
                >
                  <p>Transactions</p>
                  {pendingTransactionsNumber > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                  )}
                </TabsTrigger>
                {window.screen.width > 768 && (
                  <div className={badgeVariants({ variant: "avail" })}>
                    {pendingTransactionsNumber > 0 ? (
                      <>
                        <Loader2 className={`h-4 w-4 animate-spin`} />

                        <p className="!text-left">
                          {" "}
                          {pendingTransactionsNumber} Pending{" "}
                          <span className="mx-2">|</span>{" "}
                          {readyToClaimTransactionsNumber} Claim Ready
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className={`h-4 w-4`} />

                        <p className="!text-left"> No Pending Claims</p>
                      </>
                    )}
                  </div>
                )}
              </span>
            </h1>
          </div>
        </TabsList>
        {window.screen.width < 768 && (
          <div className={badgeVariants({ variant: "avail" })}>
            {pendingTransactionsNumber > 0 ? (
              <>
                <Loader2 className={`h-4 w-4 animate-spin`} />

                <p className="!text-left">
                  {" "}
                  {pendingTransactionsNumber} Pending |{" "}
                  {readyToClaimTransactionsNumber} Ready to Claim
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className={`h-4 w-4`} />

                <p className="!text-left"> No Pending Claims</p>
              </>
            )}
          </div>
        )}
        <TabsContent
          id="transactions"
          value="transactions"
          className="text-white h-full"
        >
          <div className="flex flex-row"></div>
          <form onSubmit={handleSubmit}>
            <p className="font-ppmori text-md mb-2 px-4">
              Search for Transactions{" "}
            </p>
            <div className="px-4 pb-2">
              <Input
                type="text"
                placeholder="Enter Avail Address"
                id="availAddress"
                value={availAddress}
                onChange={handleChangeAvailAddress}
              />
            </div>
            <div className="px-4 pb-4">
              <Input
                placeholder="Enter Eth Address"
                type="text"
                id="ethAddress"
                value={ethAddress}
                onChange={handleChangeEthAddress}
              />
            </div>
            <LoadingButton
               type="submit"
                variant="outline"
                className="rounded-lg mx-4 !border-opacity-40 !border-white"
              >
              {error ? <p className="text-red-400">{error}</p> : <p>Refetch Transactions from Indexer</p> }
              </LoadingButton>
          </form>
          <LoadingButton
                loading={loading}
                onClick={async () => {
                  setLoading(true);
                  if (!(await validAddress(availAddress, Chain.AVAIL))) {
                    showFailedMessage({ title: "Enter a Valid Avail Address" });
                    setLoading(false);
                    return;
                  } 
                  if(pendingTransactionsNumber <= 0) {
                    showFailedMessage({title: "There are no pending transactions. This account is not eligible to claim any funds"})
                    setLoading(false);
                    return;
                  }
                  if ( pendingTransactionsNumber > 0) {
                    try{
                      const response = await fetch(`/api/claim?address=${encodeURIComponent(availAddress)}&network=${encodeURIComponent('turing')}`, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                      });
                  
                      if (!response.ok) {
                        throw new Error(`Request failed with status ${response.status}`);
                      }
                  
                      const data = await response.json();
                      console.log('Response:', data);
                      showSuccessMessage({ title: (await data.message) });
                      setLoading(false);
                      return data;
                    } catch(e: any) {
                      showFailedMessage({title: e.message})
                      setLoading(false);
                    }
                  
                  } else {
                    showFailedMessage({title: 'Account has Insufficient balance'})
                    setLoading(false);
                    return;
                  }
                }} 
                variant="primary"
                className="rounded-lg my-4 mx-4"
              >
                Send .25 AVAIL for gas to added Avail Account
              </LoadingButton>
          <TransactionSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
