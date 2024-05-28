/* eslint-disable @next/next/no-img-element */
// import BridgeSection from "@/components/sections/bridgesection";
import dynamic from "next/dynamic";
const
BridgeSection = dynamic(() =>
import("@/components/sections/bridgesection"), {
ssr: false,
} 
) ;

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
        <div className="absolute bottom-4 left-8 flex flex-row space-x-4 text-opacity-80 text-white">
        
             <div className="flex flex-row justify-center items-center space-x-2 ">
               

               <p className="text-center  font-ppmoribsemibold   ">
                 {" "}
              Docs
               </p>
             </div>
             <div className="flex flex-row justify-center items-center space-x-2 ">
               

               <p className="text-center  font-ppmoribsemibold   ">
                 {" "}
              Privacy Policy
               </p>
             </div>
             
        </div>
      </div>
    </main>
  );
}
