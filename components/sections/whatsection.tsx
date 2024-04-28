"use client"

import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { SectionHeader } from "../ui/sectionheader/sectionheader";
import { IntroData } from "@/constants/text";

export default function WhatSection() {

  return (
    <div className="flex flex-col items-center justify-center space-y-10 pb-20">
      <div className="flex flex-col items-center justify-center space-y-8 w-full">
        <SectionHeader
          buttonText={"Claim Rewards"}
          heading={'How To Claim?'}
        />
      </div>
      <div className="flex flex-col items-center justify-center w-[80vw] space-y-5">
        <div className="flex flex-col md:flex-row w-full md:space-x-4 space-y-4 md:space-y-0">
          {IntroData.map((infoCard, index)=>{
            return  <div key={index} className="md:w-1/3 top_card_background flex flex-col space-y-4 py-4 px-7 relative transform transition-transform duration-3 hover:scale-105">
            <Image
              src={`/images/${index + 1}.png`}
              className="absolute top-0 right-0 object-contain h-1/2 w-auto"
              alt=""
              width={100}
              height={100}
            />
            <Image
              src={"/favicon.ico"}
              className="select-none my-4"
              alt=""
              width={40}
              height={40}
            />
            <div className="!font-thicccboibold subheading">{infoCard?.title || "not configured"}</div>
            <p className="text-white text-sm text-opacity-70">
            {infoCard?.description || "not configured"}
        </p>
            </div>
          })}
           
        </div>
           
      </div>
      <section
          className="w-[80vw] top_card_background flex md:flex-row flex-col  justify-between items-center !p-4 lg:space-x-5 "
        >
          <div className="flex flex-col space-y-5 m-2 ">
            <h3 className="!font-thicccboibold text-3xl text-white w-full ">How to Install Avail Wallet?</h3>
            <p className="font-ppmori text-lg text-white text-opacity-65 md:w-[80%]">
              After downloading the wallet, create an account and connect your wallet to the Avail platform.
           </p>
          </div>

          <Link href={"https://forum.availproject.org/"} className="px-2 mt-4 lg:mt-0">
            <Button className="rounded-full text-black" variant={"outline"} >Read More</Button>
          </Link>
        </section>
    </div>
  )
}
