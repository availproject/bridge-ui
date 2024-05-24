/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FaHistory } from "react-icons/fa";
import { HiOutlineSwitchVertical } from "react-icons/hi";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RiLoopLeftFill } from "react-icons/ri";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import Avail from "../wallets/avail";
import Eth from "../wallets/eth";
import { Button } from "../ui/button";
import {
  _getBalance,
  showFailedMessage,
  showSuccessMessage,
} from "@/utils/common";
import { useAccount } from "wagmi";
import { useAvailAccount } from "@/stores/availWalletHook";
import { useCommonStore } from "@/stores/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import LatestTransactions from "./latestransactionsection";
import { Chain, TransactionStatus } from "@/types/common";
import useBridge from "@/hooks/useBridge";
import { toast } from "@/components/ui/use-toast";
import { parseError } from "@/utils/parseError";
import BigNumber from "bignumber.js";
import { badgeVariants } from "../ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import useTransactions from "@/hooks/useTransactions";
import { parseAmount } from "@/utils/parseAmount";
import { LoadingButton } from "../ui/loadingbutton";
import useTransactionButtonState from "@/hooks/useTransactionButtonState";

const formSchema = z.object({
  fromAmount: z.preprocess(
    //@ts-ignore - preprocess is not in the types
    (a) => parseFloat(z.number().parse(a)),
    z.number({
      invalid_type_error: "Amount should be a number",
    })
  ),
  toAddress: z.string(),
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
  const { initEthToAvailBridging, initAvailToEthBridging } = useBridge();
  const { pendingTransactionsNumber, setPendingTransactionsNumber } =
    useCommonStore();
  const { pendingTransactions } = useTransactions();
  const [ethBalance, setEthBalance] = useState<string | undefined | null>(null);
  const [availBalance, setAvailBalance] = useState<string | undefined | null>(
    null
  );

  const [transactionInProgress, setTransactionInProgress] =
    useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toAddress: "",
    },
  });

  const { buttonStatus, isDisabled } = useTransactionButtonState(
    ethBalance,
    availBalance,
    transactionInProgress
  );

  /////  USE EFFECT HOOKS

  useEffect(() => {
    setPendingTransactionsNumber(
      pendingTransactions.filter(
        (transaction) => transaction.status !== TransactionStatus.CLAIMED
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

  ///// FUNCTIONS

  const resetState = async () => {
    // form.reset();
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
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (fromChain === Chain.ETH) {
        const fromAmountAtomic = new BigNumber(values.fromAmount)
          .multipliedBy(new BigNumber(10).pow(18))
          .toString(10);
        const destinationAddress = selected?.address || values.toAddress;

        setTransactionInProgress(true);
        const a = await initEthToAvailBridging({
          atomicAmount: fromAmountAtomic,
          destinationAddress: destinationAddress,
        });

        // show success message
        showSuccessMessage({
          blockhash: a,
          chain: Chain.ETH,
        });
        setTransactionInProgress(false);

        // reset state
        resetState();
      } else if (fromChain === Chain.AVAIL) {
        const fromAmountAtomic = new BigNumber(values.fromAmount)
          .multipliedBy(new BigNumber(10).pow(18))
          .toString(10);

        const destinationAddress = account?.address || values.toAddress;
        setTransactionInProgress(true);
        const init = await initAvailToEthBridging({
          atomicAmount: fromAmountAtomic,
          destinationAddress: destinationAddress,
        });

        if (init.blockhash === undefined) {
          showFailedMessage();
          setTransactionInProgress(false);
        } else {
          showSuccessMessage({
            blockhash: init.blockhash,
            chain: Chain.AVAIL,
          });
          setTransactionInProgress(false);
        }

        resetState();
      }
    } catch (error) {
      console.error(error);

      setTransactionInProgress(false);
      toast({
        title: parseError(error),
      });
    }
  }

  function Balance() {
    return (
      <>
        <div className="flex flex-row items-end justify-start pl-1 font-ppmori ">
          {fromChain === Chain.ETH ? (
            <span className="font-ppmori flex flex-row items-center justify-center space-x-2 text-white text-opacity-70 pt-1">
              Balance{" "}
              <span className="text-white font-bold mx-1 flex flex-row">
                {account.address ? (
                  ethBalance !== undefined && ethBalance !== null ? (
                    parseFloat(parseAmount(ethBalance, 18)).toFixed(2)
                  ) : (
                    <RiLoopLeftFill
                      className={`h-4 w-4 animate-spin font-bold`}
                    />
                  )
                ) : (
                  "--"
                )}{" "}
                <p className="pl-1">AVAIL</p>
              </span>
            </span>
          ) : (
            <span className="font-ppmori flex flex-row text-white text-opacity-70">
              Balance{" "}
              <span className="text-white font-bold mx-1 flex flex-row">
                {selected ? (
                  availBalance ? (
                    parseFloat(parseAmount(availBalance, 18)).toFixed(2)
                  ) : (
                    <RiLoopLeftFill
                      className={`h-4 w-4 animate-spin font-bold`}
                    />
                  )
                ) : (
                  "--"
                )}{" "}
                <p className="pl-1">AVAIL</p>
              </span>
            </span>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="text-white w-full m-4">
      <Tabs
        defaultValue="bridge"
        id="container"
        className="section_bg p-2 w-[90vw] sm:w-[70vw] lg:w-[55vw] xl:w-[45vw] "
      >
        <TabsList className="flex flex-row items-start justify-start bg-transparent !border-0 p-2 mb-6 mx-2 mt-1">
          <TabsTrigger
            value="bridge"
            className="data-[state=active]:bg-inherit data-[state=active]:bg-opacity-100 data-[state=active]:border-b !rounded-none"
          >
            <h1 className="font-ppmori text-lg">Bridge</h1>
          </TabsTrigger>
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
                          {pendingTransactionsNumber} Ready to Claim
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
                  {pendingTransactionsNumber} Ready to Claim
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
        <TabsContent id="bridge" value="bridge" className="flex-1 ">
          <div className="lg:p-4 p-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 w-full"
              >
                {/* FROM FIELD*/}
                <FormField
                  control={form.control}
                  name="fromAmount"
                  render={({ field }) => (
                    <>
                      <FormItem>
                        <FormLabel className="font-thicccboiregular !text-lg flex flex-row justify-between items-end  ">
                          <span className="font-ppmori flex flex-row items-center space-x-2">
                            <p className="text-opacity-80 text-white ">From</p>
                            <div
                              className={badgeVariants({ variant: "avail" })}
                            >
                              <img
                                src={`/images/${fromChain}small.png`}
                                alt="logo"
                              ></img>
                              <p className="!text-left">{fromChain}</p>
                            </div>
                          </span>

                          <div className="flex flex-row items-center justify-center ">
                            {fromChain === Chain.ETH ? <Eth /> : <Avail />}
                          </div>
                        </FormLabel>
                        <FormControl>
                          <>
                            <div  className="!mt-3 card_background pl-2 !rounded-xl !space-y-2 p-2 flex flex-col items-start justify-start">
                              <p className="text-white font-ppmori text-sm text-opacity-60">
                                You send
                              </p>
                              <input
                                className="!bg-inherit placeholder:text-white text-white placeholder:text-2xl text-2xl p-2 !h-8"
                                style={{
                                  border: "none",
                                  background: "none",
                                  padding: 0,
                                  margin: 0,
                                  outline: "none",
                                }}
                                type="number"
                                placeholder="0.0"
                                {...field}
                                onChange={(event) => {
                                  field.onChange(
                                    parseFloat(event.target.value)
                                  );
                                  setFromAmount(parseFloat(event.target.value));
                                }}
                              />
                            </div>

                            <div className="flex flex-row items-center justify-between">
                              <Balance />
                              <div className="flex flex-row items-center justify-center ">
                                <div
                                  onClick={() => {
                                    const value =
                                      fromChain === Chain.ETH
                                        ? ethBalance
                                        : availBalance &&
                                          parseAmount(availBalance, 18);
                                    //TODO: we need to cut a percentage for gas here, need to ask @vthunder
                                    value &&
                                      form.setValue(
                                        "fromAmount",
                                        value as unknown as number
                                      );
                                  }}
                                  className="font-thicccboisemibold text-[#3FB5F8] text-sm cursor-pointer"
                                >
                                  MAX
                                </div>
                              </div>
                            </div>
                          </>
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    </>
                  )}
                />
                <div className="relative flex items-center justify-center">
                  <div className="absolute border-b border-white border-opacity-30 w-[95%] mx-auto hover:border-opacity-60"></div>
                  <HiOutlineSwitchVertical
                    onClick={() => {
                      setFromChain(toChain);
                      setToChain(fromChain);
                    }}
                    className="h-12 w-12 bg-[#3A3E4A] transform transition-transform duration-1000 hover:p-2.5 p-3 rounded-full mx-auto cursor-pointer relative z-10"
                  />
                </div>
                {/* TO FIELD*/}
                <FormField
                  control={form.control}
                  name="toAddress"
                  render={({ field }) => (
                    <>
                      <FormItem>
                        <FormLabel className="font-thicccboiregular !text-lg flex flex-row justify-between items-end  ">
                          <span className="font-ppmori flex flex-row items-center space-x-2">
                            <p className="text-opacity-80 text-white ">To</p>
                            <div
                              className={badgeVariants({ variant: "avail" })}
                            >
                              <img
                                src={`/images/${toChain}small.png`}
                                alt="logo"
                              ></img>
                              <p className="!text-left">{toChain}</p>
                            </div>
                          </span>
                          {/* this will be opposite here since it's the To feild*/}
                          {fromChain === Chain.ETH ? <Avail /> : <Eth />}
                        </FormLabel>
                        <FormControl>
                          <>
                            <div className="!mt-3 card_background pl-2 !rounded-xl !space-y-2 p-2 flex flex-col items-start justify-start">
                              <p className="text-white font-ppmori text-sm text-opacity-60">
                                To Address
                              </p>
                              <div className="w-full flex flex-row items-center justify-between">
                                <input
                                  className="!bg-inherit placeholder:text-white text-white text-opacity-90 placeholder:text-opacity-90 placeholder:text-2xl text-2xl "
                                  style={{
                                    border: "none",
                                    background: "none",
                                    padding: 0,
                                    margin: 0,
                                    outline: "none",
                                  }}
                                  disabled={true}
                                  min={0}
                                  placeholder={
                                    fromChain === Chain.ETH
                                      ? selected?.address
                                      : account?.address
                                  }
                                  {...field}
                                  onChange={(event) => {
                                    field.onChange(+event.target.value);
                                    setToAddress(event.target.value);
                                  }}
                                />
                                {/* <div
                                  className="rounded-xl max-h-fit aspect-square  text-lg font-ppmori  justify-center cursor-pointer border border-white border-opacity-30"
                                  onClick={async () => {
                                    const address =
                                      await navigator.clipboard.readText();
                                    form.setValue("toAddress", address);
                                  }}
                                >
                                  +
                                </div> */}
                              </div>
                            </div>
                          </>
                        </FormControl>
                        <div className="flex flex-row items-center justify-between">
                          <div className="flex flex-row items-end justify-start pl-1 font-ppmori text-opacity-70"></div>
                         
                        </div>
                        <FormMessage />
                      </FormItem>
                    </>
                  )}
                />
                <br/>
                <LoadingButton
                  variant={"primary"}
                  loading={transactionInProgress}
                  type="submit"
                  className="!rounded-xl w-full !text-[15px] !py-8  font-ppmori"
                  disabled={isDisabled}
                >
                  {buttonStatus}
                </LoadingButton>
              </form>
            </Form>
          </div>
        </TabsContent>
        <TabsContent
          id="transactions"
          value="transactions"
          className="text-white flex-1  overflow-scroll"
        >
          <Tabs defaultValue="pending" className="w-[95%] mx-auto mt-2 ">
            <TabsList className="grid w-full grid-cols-2 !bg-[#33384B] !border-0 mb-4">
              <TabsTrigger value="pending" className="">
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex flex-row items-center justify-center space-x-1"
              >
                <p>History</p>
                <FaHistory />
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <div className="overflow-y-scroll">
                <LatestTransactions pending={true} />
              </div>
            </TabsContent>
            <TabsContent value="history">
              <div className="overflow-y-scroll">
                <LatestTransactions pending={false} />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
