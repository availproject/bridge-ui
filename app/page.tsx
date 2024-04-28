"use client";

/* eslint-disable @next/next/no-img-element */
import BridgeSection from "@/components/sections/bridgesection";
import { useLatestBlockInfo } from "@/store/lastestBlockInfo";

export default function Home() {
  const { ethHead } = useLatestBlockInfo()
  return (
    <main className="">
      <div className="relative h-screen w-screen items-center justify-center flex flex-col">
        <img
          src="/images/bg.png"
          alt="ok"
          className="absolute h-[110vh] w-screen object-fill content-center opacity-80 !rounded-xl"
        />
        <section className="z-10 flex flex-row items-center justify-center space-x-[2vw]">
          <BridgeSection />
        </section>
        </div>
    </main>
  );
}
