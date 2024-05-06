/* eslint-disable @next/next/no-img-element */
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FaHistory } from "react-icons/fa";
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
import { useEffect, useState } from "react";
import Avail from "../wallets/avail";
import Eth from "../wallets/eth";
import { Button } from "../ui/button";
import { _getBalance, showFailedMessage, showSuccessMessage } from "@/utils/common";
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
import { ArrowUpRight, CheckCheckIcon, CheckCircle, CheckCircle2, Loader2 } from "lucide-react";
import useTransactions from "@/hooks/useTransactions";
const formSchema = z.object({
  fromAmount: z.number(),
  toAddress: z.string(),
});

export default function BridgeSection() {
  const account = useAccount();
  const { fromChain, setFromChain, toChain, setToChain } = useCommonStore();
  const { selected } = useAvailAccount();
  const [ethBalance, setEthBalance] = useState<GLfloat | undefined>(undefined);
  const [availBalance, setAvailBalance] = useState<number | undefined>(
    undefined
  );
  const [transactionInProgress, setTransactionInProgress] =
    useState<boolean>(false);
  const { initEthToAvailBridging, initAvailToEthBridging } = useBridge();
  const { pendingTransactionsNumber, setPendingTransactionsNumber } =
    useCommonStore();
  const { pendingTransactions, completedTransactions } = useTransactions();

  useEffect(() => {
    setPendingTransactionsNumber(
      pendingTransactions.filter(
        (transaction) => transaction.status === TransactionStatus.READY_TO_CLAIM
      ).length
    );
  }, [pendingTransactions]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAmount: 0.0,
      toAddress: "",
    },
  });

  useEffect(() => {
    (async () => {
      if (account.address) {
        const result: number = await _getBalance(
          Chain.ETH,
          undefined,
          account.address
        );
        setEthBalance(result);
      } else {
        setEthBalance(undefined);
      }
      if (selected?.address) {
        const result: number = await _getBalance(
          Chain.AVAIL,
          selected?.address
        );
        setAvailBalance(result);
      } else {
        setAvailBalance(undefined);
      }
    })();
  }, [account.address, selected?.address]);


  const resetState = () => {
    form.reset();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (fromChain === Chain.ETH) {
        const fromAmountAtomic = new BigNumber(values.fromAmount)
          .multipliedBy(new BigNumber(10).pow(18))
          .toString();
        const destinationAddress = selected?.address || values.toAddress;

        setTransactionInProgress(true);
        const a = await initEthToAvailBridging({
          atomicAmount: fromAmountAtomic,
          destinationAddress: destinationAddress,
        });

        // show success message
        showSuccessMessage("jkn");
        setTransactionInProgress(false);

        // reset state
        resetState();
      } else if (fromChain === Chain.AVAIL) {
        const fromAmountAtomic = new BigNumber(values.fromAmount)
          .multipliedBy(new BigNumber(10).pow(18))
          .toString();

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
          showSuccessMessage(init.blockhash);
          setTransactionInProgress(false);
        }

        resetState();
      }
    } catch (error) {
      setTransactionInProgress(false);
      toast({
        title: parseError(error),
      });
    }
  }

  function Balance() {
    return <>
                              <div className="flex flex-row items-end justify-start pl-1 font-ppmori ">
                            {fromChain === Chain.ETH ? (
                              <span className="font-ppmori flex flex-row items-center justify-center space-x-2 text-white text-opacity-70 pt-1">
                                Balance{" "}
                                <span className="text-white font-bold mx-1 flex flex-row">
                                  {account.address ? (
                                    ethBalance !== undefined ? (
                                      ethBalance.toFixed(2)
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
                                    availBalance !== undefined ? (
                                      availBalance.toFixed(2)
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
  }

  return (
    <div className="flex md:flex-row flex-col h-full md:space-x-[2vw] max-md:space-y-[2vw]">
      <div
        id="bridge"
        className="section_bg flex-1 text-white p-4 w-[90vw] md:w-[45vw] lg:w-[45vw] xl:w-[30vw] 2xl:w-[25w]"
      >
        <div className="flex flex-row pb-[4vh] items-center justify-between">
          <h1 className="font-ppmori items-center flex flex-row space-x-2 text-white text-opacity-80 text-2xl w-full ">
            <p className="font-ppmoribsemibold">Bridge</p>
          </h1>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 w-full"
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
                        <div className={badgeVariants({ variant: "avail" })}>
                          <img src={`/images/${fromChain}small.png`}></img>
                          <p className="!text-left">{fromChain}</p>
                        </div>
                      </span>

                      <div className="flex flex-row items-center justify-center ">
                        {fromChain === Chain.ETH ? <Eth /> : <Avail />}
                      </div>
                    </FormLabel>
                    <FormControl>
                      <>
                        <div className="card_background !rounded-xl p-2 flex flex-row items-center justify-between">
                          <input
                            className="!bg-inherit"
                            style={{
                              border: "none",
                              background: "none",
                              padding: 0,
                              margin: 0,
                              outline: "none",
                            }}
                            min={0}
                            type="string"
                            placeholder="0.0"
                            {...field}
                            onChange={(event) =>
                              field.onChange(+event.target.value)
                            }
                          />
                          <Tabs
                            defaultValue="avail"
                            className=" flex flex-row items-center justify-center"
                          >
                            <TabsList className={`!bg-[#33384B] !border-0  `}>
                              <TabsTrigger
                                value="eth"
                                onClick={() => {
                                  setFromChain(Chain.ETH);
                                  setToChain(Chain.AVAIL);
                                }}
                              >
                                <Image
                                  src="/images/eth.png"
                                  alt="eth"
                                  width={20}
                                  height={20}
                                ></Image>
                              </TabsTrigger>
                              <TabsTrigger
                                value="avail"
                                onClick={() => {
                                  setFromChain(Chain.AVAIL);
                                  setToChain(Chain.ETH);
                                }}
                              >
                                <Image
                                  src="/images/logo.png"
                                  alt="eth"
                                  width={20}
                                  height={20}
                                ></Image>{" "}
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>

                        <div className="flex flex-row items-center justify-between">
<Balance/>
                          <div className="flex flex-row items-center justify-center ">
                            <button className="font-thicccboisemibold text-[#3FB5F8] text-sm">
                              MAX
                            </button>
                          </div>
                        </div>
                      </>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
            {/* TO FIELD*/}
            <FormField
              control={form.control}
              name="toAddress"
              render={({ field }) => (
                <>
                  <FormItem>
                    <FormLabel className="font-thicccboiregular !text-lg flex flex-row justify-between items-end  ">
                      <span className="font-ppmori flex flex-row items-center space-x-2">
                        <p>To</p>
                        <div className={badgeVariants({ variant: "avail" })}>
                          <img src={`/images/${toChain}small.png`}></img>
                          <p className="!text-left">{toChain}</p>
                        </div>
                      </span>
                      {/* this will be opposite here since it's the To feild*/}
                      {fromChain === Chain.ETH ? <Avail /> : <Eth />}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={true}
                        min={0}
                        placeholder={
                          fromChain === Chain.ETH
                            ? selected?.address
                            : account?.address
                        }
                        {...field}
                        onChange={(event) =>
                          field.onChange(+event.target.value)
                        }
                      />
                    </FormControl>
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-row items-end justify-start pl-1 font-ppmori text-opacity-70">
                      </div>
                      <div className="flex flex-row items-center justify-center ">
                        <button className="font-thicccboisemibold text-[#3FB5F8] text-sm">
                          + Paste Address
                        </button>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
            <Button
              variant={"primary"}
              type="submit"
              className="!rounded-xl w-full !text-md !py-6 font-ppmoribsemibold"
              disabled={transactionInProgress}
            >
              {transactionInProgress
                ? "Transaction in progress"
                : "Initiate Transaction"}
            </Button>
          </form>
        </Form>
      </div>
      <div
        id="status"
        className="section_bg flex-1 text-white p-4 md:w-[30vw] lg:w-[35w] xl:w-[30w]"
      >
        <div className="flex flex-row pb-[2vh] items-center justify-between">
          <h1 className="font-ppmori items-center flex flex-row space-x-2 text-white text-opacity-80 text-2xl w-full ">
            <span className="relative flex flex-row items-center justify-center">
              <p className="font-ppmoribsemibold">Transactions</p>
              <div className={badgeVariants({ variant: "avail" })}>
                {pendingTransactionsNumber > 0 ? <>
                  <Loader2 className={`h-4 w-4 animate-spin`} />

<p className="!text-left">
  {" "}
  {pendingTransactionsNumber} Claims Pending
</p>
                </> :<>
                <CheckCircle2 className={`h-4 w-4`} />

<p className="!text-left">
  {" "}
  No Pending Claims
</p></>}
               
              </div>
            </span>
          </h1>
        </div>
        <Tabs defaultValue="pending" className="w-[95%] mx-auto">
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
      </div>
    </div>
  );
}
