/* eslint-disable @next/next/no-img-element */
import BridgeSection from "@/components/sections/bridgesection";
import { badgeVariants } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";
import { BiSupport } from "react-icons/bi";

export default function Home() {

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
