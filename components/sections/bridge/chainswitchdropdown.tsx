import React from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommonStore } from "@/stores/common";
import { Chain } from "@/types/common";
import { badgeVariants } from "@/components/ui/badge";
import useEthWallet from "@/hooks/common/useEthWallet";

type ChainSwitcherProps = {
  selectedChain: Chain;
  type: "from" | "to";
};

/**
 * Dropdown menu for switching between chains.
 * @param {Chain} selectedChain - The currently selected chain.
 * @param {'from' | 'to'} type - The type of chain (from or to).
 *
 * this component handles logic related to switching chains and flows with logic in place to tackle impossible flows.
 * @returns {JSX.Element} The dropdown menu component.
 */

const ChainSwitcherDropDown = ({ selectedChain, type }: ChainSwitcherProps) => {
  const { setFromChain, setToChain, fromChain, toChain } = useCommonStore();
  const { validateandSwitchChain } = useEthWallet();

  const getAvailableChains = () => {
    if (type === "from") {
      return [Chain.ETH, Chain.AVAIL, Chain.BASE].filter(
        (chain) => chain !== toChain
      );
    }

    switch (fromChain) {
      case Chain.AVAIL:
        return [Chain.ETH];
      case Chain.BASE:
        return [Chain.ETH];
      case Chain.ETH:
        return [Chain.BASE, Chain.AVAIL].filter((chain) => chain !== fromChain);
      default:
        return [];
    }
  };

  const getDefaultToChain = (newFromChain: Chain): Chain => {
    switch (newFromChain) {
      case Chain.AVAIL:
        return Chain.ETH;
      case Chain.BASE:
        return Chain.ETH;
      case Chain.ETH:
        return [Chain.BASE, Chain.AVAIL].includes(toChain)
          ? toChain
          : Chain.BASE;
      default:
        return Chain.ETH;
    }
  };

  const handleChainSwitch = async (chain: Chain) => {
    console.log("handleChainSwitch");
    if (type === "from") {
        setFromChain(chain);
        await validateandSwitchChain(chain);
      if (chain === toChain) {
        // If new fromChain equals current toChain, switch toChain
        const newToChain = getDefaultToChain(chain);
        setToChain(newToChain);
      } else if (chain === Chain.AVAIL || chain === Chain.BASE) {
        // For AVAIL and BASE, always set toChain to ETH
        setToChain(Chain.ETH);
      } else if (chain === Chain.ETH && toChain === Chain.ETH) {
        // If switching to ETH and toChain is ETH, default to BASE
        setToChain(Chain.BASE);
      }
    } else {
      if (chain !== fromChain) {
        setToChain(chain);
      }
    }
  };

  const availableChains = getAvailableChains();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className={badgeVariants({ variant: "avail" })}>
          <div className="flex items-center gap-2">
            <img
              src={`/images/${selectedChain}small.png`}
              alt={`${selectedChain} logo`}
              className="w-5 h-5"
            />
            <span className="text-left">{selectedChain}</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="bg-[#3A3E4A] border-none w-40"
      >
        {availableChains.map((chain) => (
          <DropdownMenuItem
            key={chain}
            className="flex items-center hover:!bg-[#4A4E5A] hover:!text-white gap-2 cursor-pointer text-white rounded-xl p-2"
            onClick={() => handleChainSwitch(chain)}
          >
            <img
              src={`/images/${chain}small.png`}
              alt={`${chain} logo`}
              className="w-5 h-5"
            />
            <span>{chain}</span>
            {selectedChain === chain && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChainSwitcherDropDown;
