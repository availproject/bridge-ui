"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import TransactionSection from "../sections/transactions";
import PendingTxnsBadge from "@/components/common/pendingtxnsbadge";
import BridgeSection from "../sections/bridge";
import { useAvailAccount } from "@/stores/availwallet";
import { useAccount } from "wagmi";
import { useTransactionsStore } from "@/stores/transactions";
import TransactionModal from "../sections/bridge/review-and-submit";
import { useCommonStore } from "@/stores/common";
import AdvancedSettings from "./settings";

export default function Container() {
  const [activeTab, setActiveTab] = useState("bridge");

  const { selected } = useAvailAccount();
  const { address } = useAccount();
  const { fetchAllTransactions, setTransactionLoader} = useTransactionsStore();
  const { reviewDialog: { isOpen: isModalOpen, onOpenChange: setIsModalOpen } } = useCommonStore();

  useEffect(()=>{
    (async () => {
      /** means some claim is already in process so wait for that to end */
      await fetchAllTransactions({
        ethAddress: address,
        availAddress: selected?.address,
        setTransactionLoader,
      });
      const interval = setInterval(async () => {

        await fetchAllTransactions({
          ethAddress: address,  
          availAddress: selected?.address,
          setTransactionLoader,
        });

      }, 30000);
      return () => clearInterval(interval);
      
    })()
  },[selected?.address, address])

  return (
    <div className="text-white w-full my-4 flex flex-col space-y-3 items-center justify-center">
      <Tabs
        defaultValue="bridge"
        value={activeTab}
        onValueChange={setActiveTab}
        id="container"
        className="section_bg p-2 w-screen max-sm:rounded-none max-sm:!border-x-0 !max-w-xl "
      >
        <TabsList className="flex flex-row items-center justify-between bg-transparent !border-0 p-2 mb-6 mx-2 mt-2">
          <div className="flex flex-row items-center justify-between">
            <h1 className="font-ppmori items-center flex flex-row space-x-2 text-white text-opacity-80 text-2xl w-full ">
              <span className="relative flex flex-row items-center justify-center">
                <TabsTrigger
                  value="bridge"
                  className="data-[state=active]:bg-inherit data-[state=active]:bg-opacity-100 data-[state=active]:border-b !rounded-none"
                >
                  <h1 className="font-ppmori text-lg">Bridge</h1>
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="relative font-ppmori text-lg data-[state=active]:bg-inherit data-[state=active]:bg-opacity-100 data-[state=active]:border-b !rounded-none"
                >
                  <p className="data-[state=active]:border-b border-white">
                    Transactions
                  </p>
                  {activeTab === "transactions" && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="relative font-ppmori text-lg data-[state=active]:bg-inherit data-[state=active]:bg-opacity-100 !rounded-none"
                >
                  <PendingTxnsBadge />
                </TabsTrigger>
              </span>
            </h1>
          </div>
         <AdvancedSettings/>
        </TabsList>
        <TabsContent id="bridge" value="bridge" className="flex-1">
       <BridgeSection/>
        </TabsContent>
        <TabsContent
          id="transactions"
          value="transactions"
          className="text-white h-full"
        >
          <TransactionSection />
        </TabsContent>
      </Tabs>
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

