/* eslint-disable @next/next/no-img-element */
// import BridgeSection from "@/components/sections/bridgesection";
import { InfoIcon } from "lucide-react";
import dynamic from "next/dynamic";

//TOFIX: this import is dynamic due to some vercel deployement issue.
const BridgeSection = dynamic(
  () => import("@/components/sections/bridgesection"),
  {
    ssr: false,
  }
);

export default function Home() {
  return (
    <main className="">
      <div className="relative !mt-24 w-screen items-center justify-center flex flex-col">
        <section className="z-10 flex flex-col items-center justify-center space-x-[2vw]">
          <BridgeSection />

        </section>
        <img
          src="/images/bg.png"
          className="-z-50 object-cover select-none absolute top-0 left-0 h-full  w-full"
          alt=""
        />
        {/* <div className="absolute bottom-4 left-8 flex flex-row space-x-4 text-opacity-80 text-white">
          <div className="flex flex-row justify-center items-center space-x-2 ">
            <p className="text-center font-ppmoribsemibold"> Docs</p>
          </div>
          <div className="flex flex-row justify-center items-center space-x-2 ">
            <p className="text-center  font-ppmoribsemibold">
              {" "}
              Privacy Policy
            </p>
          </div>
        </div> */}
      </div>
      <div className="font-mono flex flex-row items-center text-[#ffffffa2] mt-20 text-xl w-1/2 mx-auto  space-x-2 "><InfoIcon className="w-5 h-5"/> <span>DISCLAIMER</span></div>
      <p className="text-[#ffffff67] text-sm mb-24 mt-2 w-1/2 mx-auto">You are accessing data or content provided by a third-party. The data or content is integrated into AVAIL’s (the “Company”)’s website for your convenience and is subject to the respective third-party provider’s terms and conditions and policies, which are accessible at CoinMarketCap and CoinGecko.You should read these terms and conditions and policies carefully to determine if you agree with them before you proceed. The Company assumes no responsibility for the terms or practices of the third-party and does not warrant or guarantee the accuracy, completeness, reliability or any other aspect of the third-party’s Content. Your use of the Content is entirely at your own risk.</p>
    </main>
  );
}
