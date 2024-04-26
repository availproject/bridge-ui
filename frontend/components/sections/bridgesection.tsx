/* eslint-disable @next/next/no-img-element */
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RiLoopLeftFill } from "react-icons/ri";
import { Input } from "@/components/ui/input";
import {
  ArrowLeftRightIcon,
  ChevronLeft,
  ChevronRight,
  InfoIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Chain, TxnData } from "@/@types/types";
import Avail from "../wallets/avail";
import Eth from "../wallets/eth";
import { Button } from "../ui/button";
import { _getBalance, fetchLatestTxns, sendMessage } from "@/lib/utils";
import { useAccount } from "wagmi";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { useAvailAccount } from "@/stores/availwallethook";
const formSchema = z.object({
  fromAmount: z.number().positive("Enter a Valid Amount").or(z.string()),
  toAmount: z.number().positive().or(z.string()),
});

export default function BridgeSection() {
  const [from, setFrom] = useState<Chain>(Chain.AVAIL);
  const [latestTransactions, setLatestTransactions] = useState<TxnData[]>([]);
  const { ethHead, setEthHead } = useLatestBlockInfo();
  const [ethBalance, setEthBalance] = useState<GLfloat>(0);
  const [availBalance, setAvailBalance] = useState<number>(0);
  const { selected, selectedWallet } = useAvailAccount();
  const [recent, setRecent] = useState<boolean>(false);
  const [to, setTo] = useState<Chain>(Chain.ETH);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAmount: "",
      toAmount: "",
    },
  });
  const account = useAccount();

  console.log(selected, selectedWallet, "selected");

  useEffect(() => {
    (async () => {
      if (account?.address) {
        const { txnData } = await fetchLatestTxns(
          account?.address,
          Chain.ETH,
          Chain.AVAIL
        );
        setLatestTransactions(txnData);
        console.log(txnData);
      }
    })();
  }, [account.address]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    console.log(ethHead, "before");
    await setEthHead({
      slot: 102,
      timestamp: 32,
      timestampDiff: 23,
    });
    console.log(ethHead, "after");
  }

  function LatestTransactions() {
    return <></>;
  }

  useEffect(() => {
    (async () => {
      if (account.address) {
        const result = await _getBalance(account?.address, Chain.ETH);
        setEthBalance(result);
      }
    })();
  }, [account.address]);

  useEffect(() => {
    (async () => {
      if (selected?.address) {
        const result = await _getBalance(selected?.address, Chain.AVAIL);
        setAvailBalance(result);
      }
    })();
  }, [selected?.address]);

  return (
    <div className="flex md:flex-row flex-col h-full md:space-x-[2vw] max-md:space-y-[2vw]">
      <div
        id="bridge"
        className="section_bg flex-1 text-white p-4 w-[85vw] md:w-[40vw] lg:w-[50w] xl:w-[40w] "
      >
        <div className="flex flex-row pb-[2vh] items-center justify-between">
          <h1 className="font-thicccboisemibold text-4xl w-full ">
            Avail Bridge
          </h1>
        </div>

        <Tabs
          defaultValue="avail"
          className=" flex flex-row items-center justify-center"
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 w-full"
            >
              <FormField
                control={form.control}
                name="fromAmount"
                render={({ field }) => (
                  <>
                    <FormItem>
                      <FormLabel className="font-thicccboiregular !text-lg flex flex-row justify-between items-end  ">
                        <span className="font-ppmori">From</span>
                        <div className="flex flex-row items-center justify-center ">
                          <TabsList className={`bg-inherit `}>
                            <TabsTrigger value="eth">
                              <Image
                                src="/images/eth.png"
                                alt="eth"
                                width={20}
                                height={20}
                              ></Image>
                            </TabsTrigger>
                            <TabsTrigger value="avail">
                              <Image
                                src="/images/logo.png"
                                alt="eth"
                                width={20}
                                height={20}
                              ></Image>{" "}
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="eth">
                            <Eth />
                          </TabsContent>
                          <TabsContent value="avail">
                            <Avail />
                          </TabsContent>
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="23423$"
                          {...field}
                          onChange={(event) =>
                            field.onChange(+event.target.value)
                          }
                        />
                      </FormControl>
                      <div className="flex flex-row items-end justify-start space-x-2 pl-1 !mt-4">
                        <p className="font-ppmori !text-md !text-opacity-50 !text-white">
                          Balance{" "}
                          <span className="font-ppmori !text-lg text-[#3FB5F8]">
                            <TabsContent value="eth">
                              {availBalance}
                            </TabsContent>
                            <TabsContent value="avail">
                              {ethBalance}
                            </TabsContent>
                          </span>
                        </p>
                      </div>

                      <FormMessage />
                    </FormItem>
                  </>
                )}
              />
              <FormField
                control={form.control}
                name="toAmount"
                render={({ field }) => (
                  <>
                    <FormItem>
                      <FormLabel className="font-thicccboiregular !text-lg flex flex-row justify-between items-end  ">
                        <span className="font-ppmori">To</span>
                        <TabsContent value="eth">
                          <Avail />
                        </TabsContent>
                        <TabsContent value="avail">
                          <Eth />
                        </TabsContent>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="234$"
                          {...field}
                          onChange={(event) =>
                            field.onChange(+event.target.value)
                          }
                        />
                      </FormControl>
                      <div className="flex flex-row items-end justify-start space-x-2 pl-1 !mt-4">
                        <p className="font-ppmori !text-md !text-opacity-50 !text-white">
                          Balance{" "}
                          <span className="font-ppmori !text-lg text-[#3FB5F8]">
                            <TabsContent value="eth">{ethBalance}</TabsContent>
                            <TabsContent value="avail">
                              {availBalance}
                            </TabsContent>
                          </span>
                        </p>
                      </div>

                      <FormMessage />
                    </FormItem>
                  </>
                )}
              />
              <Button
                variant={"primary"}
                type="submit"
                className="!rounded-xl w-full font-ppmori"
              >
                Initiate Transaction{" "}
                <ArrowLeftRightIcon className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </Form>
        </Tabs>
        <button
          onClick={() => {
            console.log("sfd");
            sendMessage({
              message: { ArbitraryMessage: "0xazeazeaze" },
              to: "0x0000000000000000000000000000000000000000000000000000000000000000",
              domain: 2,
            }, selected!);
          }}
        >{`sdf`}</button>
      </div>
      <div
        id="status"
        className="section_bg flex-1 text-white p-4 md:w-[30vw] lg:w-[40w] xl:w-[30w]"
      >
        <div className="flex flex-row pb-[2vh] items-center justify-between">
          <h1 className="font-thicccboiregular items-center flex flex-row space-x-3 text-white text-opacity-80 text-2xl w-full ">
            <p>Recent</p> <RiLoopLeftFill /> <></>
          </h1>
        </div>

        <LatestTransactions />
      </div>
    </div>
  );
}
