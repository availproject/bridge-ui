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
import { Input } from "@/components/ui/input";
import { LoadingButton } from "../ui/loadingbutton";
import { ArrowLeftRightIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Chain } from "@/@types/types";
import Avail from "../wallets/avail";
import Eth from "../wallets/eth";
import { Button } from "../ui/button";

const formSchema = z.object({
  fromAmount: z.number().positive("Enter a Valid Amount").or(z.string()),
  toAmount: z.number().positive().or(z.string()),
});

export default function BridgeSection() {
  const [from, setFrom] = useState<Chain>(Chain.AVAIL);
  const [recent, setRecent] = useState<boolean>(false);
  const [to, setTo] = useState<Chain>(Chain.ETH);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAmount: "",
      toAmount: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  function getBalance(address: string, chain: Chain) {
    if (chain === Chain.AVAIL) {
      return 0;
    }

  }

  return (
    <div className="section_bg text-white p-4 md:w-[60vw] lg:w-[40w] xl:w-[40w] min-h-[50vh]">
      <div className="flex flex-row pb-[2vh] items-center justify-between">
        <h1 className="font-thicccboibold text-4xl w-full ">{recent ? "Recent Transactions" : "Avail Bridge"}</h1>
        <button
          onClick={() => {
            setRecent(!recent);
          }}
          className=""
        >
          {" "}
          {recent ? <ChevronLeft /> :<ChevronRight /> }
        </button>
      </div>
      {recent ? (
        <>sdf</>
      ) : (
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
                      <FormLabel className="font-thicccboiregular !text-lg flex flex-row justify-between items-end space-x-[15vw]  ">
                        <span className="font-ppmori">From</span>
                        <div className="flex flex-row items-center justify-center">
                          <TabsList className={`bg-inherit`}>
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
                            <Eth claimAddress={undefined} />
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
                          <span className="font-ppmori !text-lg text-[#3FB5F8]">{getBalance("dsf", Chain.AVAIL)}</span>
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
                          <Eth claimAddress={undefined} />
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
                          {getBalance("dsf", Chain.AVAIL)}
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
      )}
    </div>
  );
}
