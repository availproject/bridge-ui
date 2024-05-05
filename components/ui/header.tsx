"use client";

import { Tabs, TabsList, TabsTrigger } from "./tabs";
import Image from "next/image";
import { useCommonStore } from "@/stores/common";
import { Chain } from "@/types/common";

/* eslint-disable @next/next/no-img-element */
export default function NavBar() {
  const {setFromChain} = useCommonStore()
  
  return (
    <header className="absolute  w-full top-0 !z-50 flex flex-row justify-between items-center py-4 px-8 ">
      <div className=" space-x-4 w-screen flex flex-row items-center justify-center">
        <img
          alt="Avail logo"
          className="h-8"
          height="40"
          src="/images/nav.svg"
        /> 
          {/* <Tabs
          defaultValue="avail"
          className=" flex flex-row items-center justify-center"
        >
         <TabsList className={`bg-inherit `}>
                            <TabsTrigger value="eth" onClick={()=>{
                              setFromChain(Chain.ETH)
                            }}>
                              <Image
                                src="/images/eth.png"
                                alt="eth"
                                width={20}
                                height={20}
                              ></Image>
                            </TabsTrigger>
                            <TabsTrigger value="avail" onClick={()=>{
                              setFromChain(Chain.AVAIL)
                            }}>
                              <Image
                                src="/images/logo.png"
                                alt="eth"
                                width={20}
                                height={20}
                              ></Image>{" "}
                            </TabsTrigger>
                          </TabsList>  
                        </Tabs>  */}
      </div>
    </header>
  );
}
