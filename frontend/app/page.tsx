/* eslint-disable @next/next/no-img-element */
import BridgeSection from "@/components/sections/bridgesection";
import ClaimSection from "@/components/sections/claimsection";
import FaqSection from "@/components/sections/faqsection";
import HeroSection from "@/components/sections/herosection";
import StatusSection from "@/components/sections/statussection";
import WhatSection from "@/components/sections/whatsection";
import Link from "next/link";

export default function Home() {
  return (
    <main className="">
      <div className="min-h-screen flex items-center flex-col text-white px-8 pt-[10vh] space-y-[2%]">
        <span className="flex flex-row items-center justify-end w-[72vw]">
        <h1 className="font-thicccboibold text-4xl w-full !text-left">
          Bridge Your <span className="text-[#3FB5F8]">$AVAIL</span>
        </h1>
        <Link href="/faq" className="font-ppmori w-full text-right text-sm text-[#3EB6F8]">Recent Transactions(0)</Link>
        </span>
        <section className="flex flex-row items-center justify-center space-x-[2vw]">
          <BridgeSection />
          <StatusSection />
        </section>
      </div>
      {/* <div className="relative h-screen w-screen items-center justify-center flex flex-col shadow-2xl">
        <img
          src="/images/bg.png"
          alt="ok"
          className="absolute h-screen w-screen object-fill opacity-80 !rounded-xl"
        />
       <h1 className="z-50 heading !text-left pb-10">
          Bridge Your <span className="text-[#3FB5F8]">AVAIL</span>
        </h1>
        <section className="z-50 flex flex-row items-center justify-center space-x-[2vw]">
          <BridgeSection />
          <StatusSection />
        </section>
        </div> */}
    </main>
  );
}
