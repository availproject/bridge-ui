/* eslint-disable @next/next/no-img-element */
import { Chain } from "@/types/common";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { InfoIcon } from "lucide-react";
import { Balance } from "@/components/balance";
import RenderWalletConnect from "@/components/common/renderwalletconnect";
import { decimal_points } from "@/utils/common";
import { getMaxAmount, validInputAmount } from "./utils";
import { useBalanceStore } from "@/stores/balances";
import { useCommonStore } from "@/stores/common";
import { useAvailAccount } from "@/stores/availwallet";
import { useAccount } from "wagmi";
import { useMemo } from "react";
import ChainSelectorButton from "../../chainselector";

export default function FromField() {
    
  const { balances } = useBalanceStore();
  const {fromChain, toChain, fromAmount, setFromAmount, dollarAmount } = useCommonStore();
  const { selected } = useAvailAccount();
  const account = useAccount();

  const availAmountToDollars: number = useMemo(() => {
    if (!fromAmount) return 0;
    const isValidNumber = /^\d*\.?\d*$/.test(fromAmount.toString().trim());
    if (!isValidNumber) return 0;
    const parsedAmount = Number(fromAmount);
    return !isNaN(parsedAmount) && dollarAmount ? parsedAmount * dollarAmount : 0;
    }, [fromAmount, dollarAmount]);

  return (
    <div>
      <div className="font-thicccboiregular !text-lg flex flex-row justify-between items-end">
        <span className="font-ppmori flex flex-row items-center space-x-2">
          <p className="text-opacity-80 text-white">From</p>
          <ChainSelectorButton selectedChain={fromChain} type="from" />
        </span>
        <div className="flex flex-row items-center justify-center">
          <RenderWalletConnect
            fromChain={fromChain}
            toChain={toChain}
            type="depositor"
          />
        </div>
      </div>
      <div
        className={`!mt-3 card_background pl-2 !rounded-xl !space-y-2 p-2 flex flex-row items-center justify-between ${
          !validInputAmount(fromAmount) ? "!border-red-600 border-opacity-40 !border" : ""
        }`}
      >
        <div className="!space-y-2 p-1 flex flex-col items-start justify-start">
          <p className="text-white font-ppmori text-sm text-opacity-60">
            You send
          </p>
          <input
            className="!bg-inherit max-md:w-24 placeholder:text-white text-white placeholder:text-2xl text-2xl p-2 !h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{
              border: "none",
              background: "none",
              padding: 0,
              margin: 0,
              outline: "none",
              pointerEvents: "auto"
            }}
            type="number"
            min="0"
            step="0.00001"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => {
              const value = e.target.value;
    
              if (value.startsWith('-')) return;
            
              if (value.includes('.')) {
                const decimals = value.split('.')[1];
                if (decimals && decimals.length > 5) return;
              }
              
              setFromAmount(value);
            }}
          />
          <p className="text-white font-ppmori text-sm text-opacity-60">
            ~ {availAmountToDollars.toFixed(decimal_points)}$
          </p>
        </div>
        <div className="p-4 md:mr-2 rounded-xl bg-[#464A5B] flex flex-row transform transition-transform duration-200 hover:scale-105 items-center space-x-2 font-ppmoribsemibold text-2xl justify-center cursor-pointer">
          <div className="flex flex-row items-center justify-center space-x-2 font-ppmori">
            <img
              src={`/images/AVAILsmall.png`}
              alt="logo"
              className="w-6 h-6"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between mt-1">
        {/** the below conditional switches address type based on chains */}
        <Balance
          chain={fromChain}
          address={
            fromChain === Chain.AVAIL ? selected?.address : account?.address
          }
        />
        <div className="flex flex-row items-center justify-center">
          <div
            aria-disabled={!(balances[fromChain].status === "success")}
            onClick={() => setFromAmount(getMaxAmount(balances[fromChain].value, fromChain))}
            className="aria-disabled:text-opacity-50 aria-disabled:cursor-not-allowed font-thicccboisemibold flex flex-row space-x-1 text-[#3FB5F8] text-sm cursor-pointer"
          >
            <span>MAX</span>
            <HoverCard>
              <HoverCardTrigger asChild>
                <button type="button" className="cursor-pointer">
                  <InfoIcon className="w-3 h-3" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="font-thicccboisemibold text-sm text-white text-opacity-70">
                Transfers the max available minus .25 AVAIL (only when bridging
                AVAIL to ETH) reserved to pay fees.
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </div>
    </div>
  );
}
