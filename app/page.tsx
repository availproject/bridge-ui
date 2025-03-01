

import Container from "@/components/common/container";
import { InfoIcon } from "lucide-react";

export default function Home() {

  return (
    <main className="">
      <div className="relative !mt-12 w-screen items-center justify-center flex flex-col">
        <section className="z-10 flex items-center justify-center">
          <Container />
        </section>
      </div>
      <div className="font-mono flex flexx-row items-center text-[#ffffffa2] max-md:px-6 mt-20 text-xl md:w-1/2 mx-auto  space-x-2 ">
        <InfoIcon className="w-5 h-5" /> <span>DISCLAIMER</span>
      </div>
      <p className="text-[#ffffff67] text-sm mb-24 mt-2 max-md:px-6 md:w-1/2 mx-auto">
        You are accessing data or content provided by a third-party. The data or
        content is integrated into AVAIL’s (the “Company”)’s website for your
        convenience and is subject to the respective third-party provider’s
        terms and conditions and policies, which are accessible at{" "}
        <a href="https://coinmarketcap.com/terms/" className="underline">
          CoinMarketCap
        </a>{" "}
        and{" "}
        <a href="https://www.coingecko.com/en/terms" className="underline">
          CoinGecko
        </a>
        . You should read these terms and conditions and policies carefully to
        determine if you agree with them before you proceed. The Company assumes
        no responsibility for the terms or practices of the third-party and does
        not warrant or guarantee the accuracy, completeness, reliability or any
        other aspect of the third-party’s Content. Your use of the Content is
        entirely at your own risk.
      </p>
    </main>
  );
}
