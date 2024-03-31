"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
/* eslint-disable @next/next/no-img-element */
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
import { CustomEthWalletButton } from "../connections/CustomEthWalletButton";
import { ChainSelectDropdown } from "../ui/chainselectdropdown";
import { LoadingButton } from "../ui/loadingbutton";
import { ArrowLeftRightIcon } from "lucide-react";
import { badgeVariants } from "../ui/badge";
import { setFlagsFromString } from "v8";
import { useState } from "react";
import { Chain } from "@/@types/types";
import Avail from "../wallets/avail";
import Eth from "../wallets/eth";

const formSchema = z.object({
  fromAddress: z.string().min(2).max(50),
  fromChain: z.string().min(2).max(50),
  toChain: z.string().min(2).max(50),
  toAddress: z.string().min(2).max(50),
  amount: z.number().positive(),
});

export default function BridgeSection() {
  
  const [from, setFrom] = useState<Chain>(Chain.AVAIL);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAddress: "",
      toAddress: "",
      amount: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }
  return (
    <div className="section_bg text-white w-[40vw] p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <>
                <FormItem>
                  <FormLabel className="font-thicccboiregular !text-lg flex flex-row justify-between items-end  ">
                    From:
                    <div className="flex flex-row items-center justify-end">
                    <Tabs defaultValue="avail" className=" ">
                      <TabsList
                        className={`bg-inherit`}
                      >
                        <TabsTrigger value="eth" onSelect={()=>{
                          setFrom(Chain.ETHEREUM)
                        }}>
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
                    </Tabs>
                      {from === Chain.ETHEREUM ? (<>
                      <CustomEthWalletButton/>
                      </>) :(<>
<Avail/>
                      </>)}
                    </div>
                   
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="234$" {...field} />
                  </FormControl>
                  <FormDescription className="flex flex-row items-end justify-start space-x-2 pl-2 !mt-4">
                    <h2 className="font-ppmori !text-lg">Balance:</h2>
                    <p className="font-ppmori !text-lg text-[#3FB5F8]">0.0</p>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <>
                <FormItem>
                  <FormLabel className="font-thicccboiregular !text-lg flex flex-row justify-between items-end  ">
                    From:
                    <Eth claimAddress={undefined}/>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="234$" {...field} />
                  </FormControl>
                  <FormDescription className="flex flex-row items-end justify-start space-x-2 pl-2 !mt-4">
                    <h2 className="font-ppmori !text-lg">Balance:</h2>
                    <p className="font-ppmori !text-lg text-[#3FB5F8]">0.0</p>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </>
            )}
          />
          <LoadingButton
            variant={"primary"}
            type="submit"
            className="!rounded-xl w-full font-ppmori"
          >
            Initiate Transaction <ArrowLeftRightIcon className="ml-2 w-4 h-4" />
          </LoadingButton>
        </form>
      </Form>
    </div>
  );
}
