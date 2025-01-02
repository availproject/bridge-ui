import { Chain } from "@/types/common";
import AddressDialog from "./pasteaddress";
import { ClipboardCopyIcon, InfoIcon, Wallet } from "lucide-react";
import RenderWalletConnect from "@/components/common/renderwalletconnect";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useAvailAccount } from "@/stores/availwallet";
import { useCommonStore } from "@/stores/common";
import ChainSelectorButton from "../../chainselector";

export default function ToField() {
  const { fromChain, toChain, toAddress, setToAddress } = useCommonStore();
  const { isConnected: connected, address: ethAddress } = useAccount();
  const { selected } = useAvailAccount();

  useEffect(() => {
    if (toChain === Chain.AVAIL && selected) {
      setToAddress(selected.address);
    }
    if ((toChain === Chain.BASE || toChain === Chain.ETH) && ethAddress) {
      setToAddress(ethAddress);
    }
  }, [connected, selected, toChain]);

  return (
    <div>
      <div className="font-thicccboiregular !text-lg flex flex-row justify-between items-end mb-1">
        <span className="font-ppmori flex flex-row items-center space-x-2">
          <p className="text-opacity-80 text-white">To</p>
          <ChainSelectorButton selectedChain={toChain} type="to" />
        </span>
        <RenderWalletConnect
          fromChain={fromChain}
          toChain={toChain}
          type="receiver"
        />
      </div>
      <div
        className={`!mt-3 card_background pl-2 !rounded-xl !space-y-2 p-2 flex flex-row items-center justify-between`}
      >
        <div className="!space-y-2 p-1 flex flex-col items-start justify-start w-full">
          <p className="text-white font-ppmori text-sm text-opacity-60">
            To Address
          </p>
          <div className={`relative ${!toAddress && "w-full"}`}>
            <input
              className={`w-full ${
                !toAddress
                  ? `bg-none text-white text-opacity-90 placeholder:w-full`
                  : `placeholder:text-white pl-8 placeholder:pl-8 !bg-[#2f3441] placeholder:p-4 !rounded-lg text-2xl placeholder:text-opacity-90`
              } `}
              style={{
                border: "none",
                background: "none",
                outline: "none",
              }}
              disabled={true}
              min={0}
              placeholder={
                fromChain === Chain.AVAIL
                  ? ethAddress
                    ? ethAddress.slice(0, 10) + "..." + ethAddress.slice(-4)
                    : "Connect Wallet or add address"
                  : selected?.address
                  ? selected.address.slice(0, 10) +
                    "..." +
                    selected.address.slice(-4)
                  : "Connect Wallet or add address"
              }
              value={
                toAddress
                  ? toAddress.slice(0, 12) + "..." + toAddress.slice(-4)
                  : ""
              }
              onChange={(event) => setToAddress(event.target.value)}
            />
            {/** this conditional just renders a badge when the receiver wallet is connected rather than pasted address, switches address based on chains */}
            {!toAddress ? null : (fromChain === Chain.ETH &&
                selected?.address) ||
              (fromChain === Chain.AVAIL && ethAddress) ||
              (fromChain === Chain.BASE && selected?.address) ? (
              <div className="">
                <Wallet className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="">
                <ClipboardCopyIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
      <AddressDialog setToAddress={setToAddress} toChain={toChain} />
    </div>
  );
}
