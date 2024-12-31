///////// OUTDATED //////////


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
 * This component handles chain switching with improved UX to allow for more flexible chain combinations.
 * @returns {JSX.Element} The dropdown menu component.
 */

const ChainSwitcherDropDown = ({ selectedChain, type }: ChainSwitcherProps) => {
  const { setFromChain, setToChain, fromChain, toChain } = useCommonStore();
  const { validateandSwitchChain } = useEthWallet();

  const getAvailableChains = () => {
    if (type === "from") {
      // Show all chains for "from" dropdown
      return [Chain.ETH, Chain.AVAIL, Chain.BASE];
    }

    // For "to" dropdown, adjust based on fromChain
    if (fromChain === Chain.ETH) {
      return [Chain.BASE, Chain.AVAIL];
    }
    // If from is either BASE or AVAIL, only show ETH
    return [Chain.ETH];
  };

  const handleChainSwitch = async (chain: Chain) => {
    if (type === "from") {
      setFromChain(chain);
      // If new from chain is ETH, keep current to chain if valid, otherwise default to BASE
      if (chain === Chain.ETH) {
        if (toChain === Chain.BASE || toChain === Chain.AVAIL) {
          // Keep current to chain as it's valid
        } else {
          setToChain(Chain.BASE);
        }
      } else {
        // If new from chain is BASE or AVAIL, to chain must be ETH
        setToChain(Chain.ETH);
      }
      await validateandSwitchChain(chain);
    } else {
      if (chain === fromChain) {
        // Swap positions if same chain selected
        setFromChain(toChain);
        setToChain(fromChain);
        await validateandSwitchChain(toChain);
      } else {
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
        className="bg-[#252831] border-none w-40"
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