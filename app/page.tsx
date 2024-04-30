"use client";

/* eslint-disable @next/next/no-img-element */
import BridgeSection from "@/components/sections/bridgesection";
import { useLatestBlockInfo } from "@/store/lastestBlockInfo";

export default function Home() {
  return (
    <main className="">
      <div className="relative h-screen w-screen items-center justify-center flex flex-col">
        <section className="z-10 flex flex-row items-center justify-center space-x-[2vw]">
          <BridgeSection />
        </section>
        </div>
    </main>
  );
}
