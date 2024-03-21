"use client"

import { useMobileView } from "@/hooks/useMobileView";
import AvailWallet from "../cards/AvailWallet";
import EthWallet from "../cards/EthWallet";
import Github from "../cards/Github";
import { useEffect, useState } from "react";
import { formatTime, getEndTimeStamp } from "@/lib/utils";


export default function ClaimSection() {
  const [endTimestamp, setEndTimestamp] = useState<string>();

  const isMobile = useMobileView();

  useEffect(() => {
    (async()=> {
      const fetchEndTimeStamp = await getEndTimeStamp();
      console.log(fetchEndTimeStamp, "fetchEndTimeStamp")
      if(fetchEndTimeStamp) {
      //@ts-ignore
      const t:string = formatTime(fetchEndTimeStamp.data.endTime!);
      setEndTimestamp(t);
      }
    })();
  }, []);


    return isMobile ? <>
    
    </> : <section id="claim" className="py-20">
        <div className="w-[88vw] flex flex-row items-center mx-auto justify-between">
          <div className="w-[50%]">
          <h1 className="text-white font-thicccboibold heading !text-left pb-4">
          Claim your rewards
        </h1>
        <h2 className="paragraph !text-white !font-ppmori !leading-relaxed !text-opacity-60">
          Please Note: This is just an eligibility checker. Your rewards will be
          sent to your avail wallet on June 14, 2024.
        </h2>
          </div>
          <div className="w-[40%]">
          <h2 className="paragraph !text-right !text-white !font-ppmori  !text-opacity-60">
         Time Left:
        </h2>
        <h1 className="text-white !text-right !pr-0 !mr-0 font-thicccboibold text-3xl pb-4">
        {endTimestamp}
        </h1>
          </div>

      </div>
     <div className="flex w-screen items-center justify-center pt-10">
      <div className="section_bg w-[90vw] my-auto flex flex-col p-8 ">
        <h1 className="text-white font-thicccboibold heading !text-left pb-4">
          Connect to check your rewards:
        </h1>
        <div className="flex flex-col space-y-4 pt-4">
          <AvailWallet />
          <Github />
          <EthWallet />
        </div>
      </div>
      </div></section>
}