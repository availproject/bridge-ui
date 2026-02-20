import React, { useState } from "react";
import Image from "next/image";
import { badgeVariants } from "@/components/ui/badge";
import { Chain } from "@/types/common";
import ChainSelectorModal from "./chainselectormodal";
import { capitalizeFirstLetter } from "@/hooks/wormhole/helper";

type ChainSelectorButtonProps = {
  selectedChain: Chain;
  type: "from" | "to";
};

const ChainSelectorButton = ({
  selectedChain,
  type,
}: ChainSelectorButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={badgeVariants({ variant: "avail" })}
      >
        <div className="flex items-center justify-center gap-2">
          <Image
            src={`/images/${selectedChain}small.png`}
            alt={`${selectedChain} logo`}
            width={20}
            height={20}
            className="w-5 h-5"
            priority
          />
          <span className="text-left">
            {capitalizeFirstLetter(selectedChain.toLocaleLowerCase())}
          </span>
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
