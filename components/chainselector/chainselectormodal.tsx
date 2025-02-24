import React from "react";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Chain } from "@/types/common";
import { useCommonStore } from "@/stores/common";
import { ChevronLeft } from "lucide-react";
import useEthWallet from "@/hooks/common/useEthWallet";
import { capitalizeFirstLetter } from "@/hooks/wormhole/helper";

type ChainSelectorModalProps = {
 isOpen: boolean;
 onClose: () => void;
 type: "from" | "to";
};

const ChainSelectorModal = ({ isOpen, onClose, type }: ChainSelectorModalProps) => {
  const { setFromChain, setToChain, fromChain, toChain } = useCommonStore();
  const { validateandSwitchChain } = useEthWallet();
  
  const handleChainSelect = async (selectedChain: Chain) => {
    if (type === "from") {
      if (selectedChain === toChain) {
        // If selected source chain is same as destination, swap them
        setToChain(fromChain);
      }
      setFromChain(selectedChain);
      await validateandSwitchChain(selectedChain);
    } else {
      if (selectedChain === fromChain) {
        // If selected destination chain is same as source, swap them
        await validateandSwitchChain(toChain);
        setFromChain(toChain);
        setToChain(fromChain);
      } else {
        setToChain(selectedChain);
      }
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="[&_button[type='button']]:hidden bg-[#252A3C] border-none p-0 gap-0 max-w-[25rem]">
        <div className="rounded-t-xl px-4 py-5">
          <DialogHeader className="p-0 bg-[#252A3C]">
            <div className="flex items-center gap-2">
              <ChevronLeft 
                className="h-6 w-6 cursor-pointer text-gray-400 hover:text-white" 
                onClick={onClose}
              />
              <DialogTitle className="font-sm text-white mt-1 font-ppmori">
                Select chain to bridge {type}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        <div className="p-4 bg-[#1D2230]">
          {Object.values(Chain).map((chain) => (
            <div
              key={chain}
              onClick={() => handleChainSelect(chain)}
              className="flex items-center justify-between p-4 mb-2 last:mb-0 rounded-xl cursor-pointer bg-[#252A3C] hover:bg-[#2A2F41] transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <img
                  src={`/images/${chain}small.png`}
                  alt={`${chain} logo`}
                  className="w-8 h-8"
                />
                <span className="text-white text-md font-medium">
                  {capitalizeFirstLetter(chain.toLocaleLowerCase())}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center p-4 text-[#8B8EA3] text-sm border-t bg-[#1D2230] rounded-b-xl border-[#252A3C]">
          looking for the testnet bridge, <a href="https://turing.bridge.avail.so/" className="italic cursor-pointer ml-1 underline">click here</a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChainSelectorModal;
