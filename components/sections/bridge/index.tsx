
import { useCommonStore } from "@/stores/common";
import SubmitTransaction from "./submittransaction";
import { HiOutlineSwitchVertical } from "react-icons/hi";
import FromField from "./fromfield";
import ToField from "./tofield";
import useEthWallet from "@/hooks/common/useEthWallet";

export default function BridgeSection() {
  const {
    fromChain,
    setFromChain,
    toChain,
    setToChain,
  } = useCommonStore();

  const { validateandSwitchChain } = useEthWallet();

  return (
    <div className="lg:p-4 p-2">
      <div className="md:space-y-4 w-full">
        <FromField/>
        <div className="relative flex items-center justify-center">
          <HiOutlineSwitchVertical
            onClick={async () => {
              await validateandSwitchChain(toChain);
              setFromChain(toChain);
              setToChain(fromChain);
            }}
            className="h-12 w-12 md:bg-[#3A3E4A] transform transition-transform duration-1000 hover:p-2.5 p-3 rounded-xl mx-auto cursor-pointer relative z-10"
          />
        </div>
        <ToField />
        <SubmitTransaction />
      </div>
    </div>
  );
}
