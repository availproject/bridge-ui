/* eslint-disable @next/next/no-img-element */
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FaHistory } from "react-icons/fa";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ArrowLeftRightIcon, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import Avail from "../wallets/avail";
import Eth from "../wallets/eth";
import { Button } from "../ui/button";
import { _getBalance } from "@/utils/common";
import { useAccount } from "wagmi";
import { useAvailAccount } from "@/stores/availWalletHook";
import { useCommonStore } from "@/stores/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import LatestTransactions from "./latestransactionsection";
import { Chain } from "@/types/common";
import useBridge from "@/hooks/useBridge";
import { toast } from "@/components/ui/use-toast";
import { parseError } from "@/utils/parseError";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import BigNumber from "bignumber.js";
import { getMerkleProof } from "@/services/api";
const formSchema = z.object({
  fromAmount: z.number().or(z.string()),
  toAddress: z.string(),
});

export default function BridgeSection() {
  const account = useAccount();
  const { fromChain } = useCommonStore();
  const { selected } = useAvailAccount();
  const [ethBalance, setEthBalance] = useState<GLfloat | undefined>(undefined);
  const [availBalance, setAvailBalance] = useState<number | undefined>(undefined);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const { initEthToAvailBridging, initAvailToEthBridging } = useBridge()
  const { avlHead, ethHead } = useLatestBlockInfo()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAmount: "",
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
        console.log(result, "ooo")

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

  const showSuccessMessage = (blockhash: `${string}`) => {
    toast({
      title: "Transaction initiated successfully",
      description: blockhash,
    });
   };

  const showFailedMessage = () => {
    toast({
      title: "Transaction failed",
      description: "Please try again",
    }); }

  const resetState = () => {
    form.reset();
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {

    try {
      if (fromChain === Chain.ETH) {
        const fromAmountAtomic = new BigNumber(values.fromAmount).multipliedBy(new BigNumber(10).pow(18)).toString();
        const destinationAddress = selected?.address || values.toAddress;

        setTransactionInProgress(true);
        const a = await initEthToAvailBridging({ atomicAmount: fromAmountAtomic, destinationAddress: destinationAddress })

        // show success message
        showSuccessMessage("jkn");
        setTransactionInProgress(false);

        // reset state
        resetState();
      } else if (fromChain === Chain.AVAIL) {
        const fromAmountAtomic = new BigNumber(values.fromAmount).multipliedBy(new BigNumber(10).pow(18)).toString();

        const destinationAddress = account?.address || values.toAddress;
        setTransactionInProgress(true);
        const init = await initAvailToEthBridging({ atomicAmount: fromAmountAtomic, destinationAddress: destinationAddress })

        if(init.blockhash === undefined) {
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
        title: parseError(error)
      })
    }
  }

  return (
    <div className="flex md:flex-row flex-col h-full md:space-x-[2vw] max-md:space-y-[2vw]">
      <div
        id="bridge"
        className="section_bg flex-1 text-white p-4 w-[85vw] md:w-[40vw] lg:w-[50w] xl:w-[40w] "
      >
        <div className="flex flex-row pb-[4vh] items-center justify-between"></div>
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
                        <p>From</p>
                        <span
                          className={`${fromChain === Chain.AVAIL
                            ? "text-[#3EB6F8]"
                            : "text-[#8C8C8C]"
                            } text-sm font-mono`}
                        >
                          ({fromChain})
                        </span>
                      </span>
                      <div className="flex flex-row items-center justify-center ">
                        {fromChain === Chain.ETH ? <Eth /> : <Avail />}
                      </div>
                    </FormLabel>
                    <FormControl>
                      <>
                        <Input
                          min={0}
                          placeholder="23423 AVAIL"
                          {...field}
                          onChange={(event) =>
                            field.onChange(+event.target.value)
                          }
                        />
                        <div className="flex flex-row items-center justify-between">
                          <div className="flex flex-row items-end justify-start pl-1 font-ppmori ">
                            {fromChain === Chain.ETH ? (
                              <span className="font-ppmori text-white text-opacity-70">
                                Balance{" "}
                                <span className="text-[#3382E8]">
                                {account.address ?  ( ethBalance !== undefined ? ethBalance : <RiLoopLeftFill className={`h-3 w-3 animate-spin text-[#3FB5F8]`} />) : "Connect Wallet"}   
                                </span>
                              </span>
                            ) : (
                              <span className="font-ppmori text-white text-opacity-70">
                                Balance{" "}
                                <span className="text-[#3382E8]">
                               {selected ?  ( availBalance !== undefined ? availBalance : <RiLoopLeftFill className={`h-3 w-3 animate-spin text-[#3FB5F8]`} />) : "Connect Wallet"}   
                                </span>
                              </span>
                            )}
                          </div>
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
                        <span className=" text-sm font-mono">{!fromChain}</span>
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
                        {/* this will be opposite here since it's the To feild*/}
                        {/* {fromChain === Chain.ETH ? (
                          <span className="font-ppmori text-white text-opacity-70">
                            Balance{" "}
                            <span className="text-[#3382E8]">
                              {availBalance}
                            </span>
                          </span>
                        ) : (
                          <span className="font-ppmori text-white text-opacity-70">
                            Balance{" "}
                            <span className="text-[#3382E8]">{ethBalance}</span>
                          </span>
                        )} */}
                      </div>
                      <div className="flex flex-row items-center justify-center ">
                        <button className="font-thicccboisemibold text-[#3FB5F8] text-sm">
                          + Add Address
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
              className="!rounded-xl w-full items-end  font-ppmori"
              disabled={transactionInProgress}
            >
              {transactionInProgress ? 'Transaction in progress' : 'Initiate Transaction'}
              <ArrowLeftRightIcon className="ml-2 w-4 h-4" />
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
            <p className="font-thicccboibold">Transactions</p>
            <RiLoopLeftFill className={`h-5 w-5 text-[#3FB5F8]`} />
          </h1>
        </div>
        <Tabs defaultValue="pending" className="w-[95%] mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-inherit mb-4">
            <TabsTrigger value="pending" className="">
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex flex-row items-center justify-center space-x-1"
            >
              <p>History</p> <FaHistory />
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
