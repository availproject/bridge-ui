/* eslint-disable @next/next/no-img-element */
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function TxnAddresses({
    depositor,
    receiver,
  }: {
    depositor: string;
    receiver: string;
  }) {
    return (
      <span className="cursor-pointer flex mt-2 text-white text-opacity-70 flex-row w-full text-sm underline">
        <HoverCard>
          <HoverCardTrigger>From</HoverCardTrigger>
          <HoverCardContent className="bg-[#141414]">
            <p className="text-white text-opacity-80 !font-thicccboisemibold flex flex-row">
              <span>Depositor Address</span>{" "}
              <img
                src="/images/Wallet.png"
                className="pl-1 !w-5 h-4"
                alt="wallet"
              ></img>
            </p>
            <p className="text-white text-opacity-70 overflow-scroll">
              {depositor}
            </p>
          </HoverCardContent>
        </HoverCard>
        <ArrowUpRight className="w-4 h-4 mr-2" />
        <HoverCard>
          <HoverCardTrigger className="">To </HoverCardTrigger>
          <HoverCardContent>
            <p className="text-white text-opacity-80 !font-thicccboisemibold flex flex-row ">
              <span>Receiver Address</span>{" "}
              <img
                src="/images/Wallet.png"
                className="pl-1 !w-5 h-4"
                alt="wallet"
              ></img>
            </p>
            <p className="text-white text-opacity-70 overflow-scroll">
              {receiver}
            </p>
          </HoverCardContent>
        </HoverCard>{" "}
        <ArrowDownLeft className="w-4 h-4" />
      </span>
    );
  }
