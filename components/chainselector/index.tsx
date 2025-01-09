import React, { useState } from "react";
import { badgeVariants } from "@/components/ui/badge";
import { Chain } from "@/types/common";
import ChainSelectorModal from "./chainselectormodal";
import { capitalizeFirstLetter } from "@/hooks/wormhole/helper";

type ChainSelectorButtonProps = {
  selectedChain: Chain;
  type: "from" | "to";
};

const ChainSelectorButton = ({ selectedChain, type }: ChainSelectorButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={badgeVariants({ variant: "avail" })}
      >
        <div className="flex items-center justify-center gap-2">
          <img
            src={`/images/${selectedChain}small.png`}
            alt={`${selectedChain} logo`}
            className="w-5 h-5"
          />
          <span className="text-left">{capitalizeFirstLetter(selectedChain.toLocaleLowerCase())}</span>
        </div>
      </button>

      <ChainSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
      />
    </>
  );
};

export default ChainSelectorButton;