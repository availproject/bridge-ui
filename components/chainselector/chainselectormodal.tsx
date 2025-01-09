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
import { 
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";

type ChainSelectorModalProps = {
 isOpen: boolean;
 onClose: () => void;
 type: "from" | "to";
};

const ChainSelectorModal = ({ isOpen, onClose, type }: ChainSelectorModalProps) => {
 const { setFromChain, setToChain, fromChain, toChain } = useCommonStore();
 const { validateandSwitchChain } = useEthWallet();

 const isInvalidCombination = (chain: Chain) => {
    if (type === "from") {
      return (toChain === Chain.BASE && chain === Chain.AVAIL) || 
             (toChain === Chain.AVAIL && chain === Chain.BASE);
    }
    if (type === "to") {
      return (fromChain === Chain.BASE && chain === Chain.AVAIL) || 
             (fromChain === Chain.AVAIL && chain === Chain.BASE);
    }
    return false;
  };
  
  const handleChainSelect = async (selectedChain: Chain) => {
    if (isInvalidCombination(selectedChain)) return;
  
    if (type === "from") {
      const needToAdjustToChain = selectedChain === toChain || 
        // Add check for BASE <-> AVAIL combination
        (selectedChain === Chain.AVAIL && toChain === Chain.BASE) ||
        (selectedChain === Chain.BASE && toChain === Chain.AVAIL);
  
      if (needToAdjustToChain) {
        setToChain(selectedChain === Chain.ETH ? Chain.BASE : Chain.ETH);
      }
  
      setFromChain(selectedChain);
      await validateandSwitchChain(selectedChain);
    } else {
      if (selectedChain === fromChain) {
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
           <TooltipProvider key={chain}>
             <Tooltip>
               <TooltipTrigger asChild>
                 <div
                   onClick={() => handleChainSelect(chain)}
                   className={`
                     flex items-center justify-between p-4 mb-2 last:mb-0 rounded-xl 
                     ${isInvalidCombination(chain)
                       ? 'opacity-50 cursor-not-allowed bg-[#252A3C]'
                       : 'cursor-pointer bg-[#252A3C] hover:bg-[#2A2F41] transition-colors duration-200'
                     }
                   `}
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
               </TooltipTrigger>
               {isInvalidCombination(chain) && (
                 <TooltipContent side="right">
                   <p>Chain combination not allowed</p>
                 </TooltipContent>
               )}
             </Tooltip>
           </TooltipProvider>
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