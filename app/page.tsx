"use client";

/* eslint-disable @next/next/no-img-element */
import BridgeSection from "@/components/sections/bridgesection";
import { badgeVariants } from "@/components/ui/badge";
import { appConfig } from "@/config/default";
import useEthWallet from "@/hooks/useEthWallet";
import useTransactions from "@/hooks/useTransactions";
import { Chain } from "@/types/common";
import { pollWithDelay } from "@/utils/poller";
import { ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { BiSupport } from "react-icons/bi";

export default function Home() {
  const { activeUserAddress } = useEthWallet()
  const { fetchTransactions, addToLocalTransaction } = useTransactions()

  const appInit = async () => {
    if (!activeUserAddress) return;

    // Fetch all transactions
    // and keep polling
    pollWithDelay(
      fetchTransactions,
      [{
        userAddress: activeUserAddress,
      }],
      appConfig.bridgeIndexerPollingInterval,
      () => true
    )

    // todo: remove demo code
    // this is how you add a local transaction
    /*

    //add this at the end of a successfull init of txn
    const tempLocalTransaction: Transaction = {
      "status": TransactionStatus.INITIALIZED,
      "destinationChain": Chain.AVAIL,
      "messageId": 0,
      "sourceChain": Chain.ETH,
      "amount": "7890000000000000000",
      "dataType": "ERC20",
      "depositorAddress": activeUserAddress,
      "receiverAddress": "5HEt5VbgdoiKMJtmFfbtFLphw1yiuus6kf2PA39oukqhtUAQ",
      "sourceBlockHash": "0xbca24c71342a93158d92c81b50f43d3c3fd9088f1227bbe4b5a36875ad8c26fe",
      "sourceTransactionBlockNumber": 5811152,
      "sourceTransactionHash": "0xabc",
      "sourceTransactionIndex": 66,
      "sourceTransactionTimestamp": "2024-04-30T21:31:48.000Z"
    }

    await addToLocalTransaction(tempLocalTransaction)
    */
  }

  useEffect(() => {
    appInit()
  }, [activeUserAddress])

  return (
    <main className="">
      <div className="relative h-screen w-screen items-center justify-center flex flex-col">

        <section className="z-10 flex flex-row items-center justify-center space-x-[2vw]">
          <BridgeSection />
        </section>
        <img
          src="/images/bg.png"
          className="-z-50 object-cover select-none absolute top-0 left-0 h-full  w-full"
          alt=""
        />
        <div className="absolute bottom-4 right-4 flex flex-row space-x-2">
        <div className={badgeVariants({ variant: "avail" })}>
               

               <p className="!text-center">
                 {" "}
               Contact Support
               </p>
               <BiSupport  className="h-4 w-4"/>
             </div>
             <div className={badgeVariants({ variant: "avail" })}>
               

               <p className="!text-center">
                 {" "}
               Refer Bridging Docs
               </p>
               <ArrowUpRight className="h-4 w-4"/>
             </div>
        </div>
      </div>
    </main>
  );
}
