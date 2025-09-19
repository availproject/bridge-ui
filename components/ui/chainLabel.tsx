import * as React from "react";
import Image from "next/image";
import { Chain } from "@/types/common";

type ChainLabelProps = {
  chain: Chain;
};

function ChainLabel({ chain }: ChainLabelProps) {
  switch (chain) {
    case Chain.ETH:
      return (
        <div className="flex flex-row items-center justify-center space-x-1">
          <Image
            src="/images/ETHEREUMsmall.png"
            alt="eth"
            width={16}
            height={16}
            className="w-4 h-4"
            priority
          />
          <p className="hidden md:flex text-opacity-70 text-white text-sm">
            Ethereum
          </p>
        </div>
      );
    case Chain.BASE:
      return (
        <div className="flex flex-row items-center justify-center space-x-1">
          <Image
            src="/images/BASEsmall.png"
            alt="base"
            width={16}
            height={16}
            className="w-4 h-4"
            priority
          />
          <p className="hidden md:flex text-opacity-70 text-white text-sm">
            Base
          </p>
        </div>
      );
    case Chain.AVAIL:
      return (
        <div className="flex flex-row items-center justify-center space-x-1">
          <Image
            src="/images/AVAILsmall.png"
            alt="avail"
            width={16}
            height={16}
            className="w-4 h-4"
            priority
          />
          <p className="hidden md:flex text-opacity-70 text-white text-sm">
            Avail
          </p>
        </div>
      );
    default:
      return null;
  }
}

export { ChainLabel };
