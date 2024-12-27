/* eslint-disable @next/next/no-img-element */
import { useState, useCallback } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Copy, ExternalLink } from "lucide-react";
import { IoIosArrowDown } from "react-icons/io";
import { Transaction } from "@/types/transaction";
import { Logger } from "@/utils/logger";
import { getHref } from "@/utils/common";

export default function TxnAddresses({ txn }: { txn: Transaction }) {
  const [isHoverCardOpen, setIsHoverCardOpen] = useState(false);
  const [copiedStates, setCopiedStates] = useState({
    depositor: false,
    receiver: false,
    sourceHash: false,
    destHash: false,
  });

  const handleCopy = useCallback(
    (text: string, key: keyof typeof copiedStates) => {
      try {
        navigator.clipboard.writeText(text);
        setCopiedStates((prev) => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopiedStates((prev) => ({ ...prev, [key]: false }));
        }, 2000);
      } catch (error: any) {
        Logger.error("Error copying text to clipboard", error);
      }
    },
    []
  );

  const AddressRow = ({
    label,
    address,
    stateKey,
  }: {
    label: string;
    address: string;
    stateKey: keyof typeof copiedStates;
  }) => (
    <div className="flex items-center justify-between w-full group !text-sm">
      <p className="text-white text-opacity-70 overflow-scroll">
        <span className="font-bold">{label}</span>: {address.slice(0, 6)}...
        {address.slice(-4)}
      </p>
      <Copy
        className={`w-4 h-4 ml-2 cursor-pointer transition-colors duration-200 ${
          copiedStates[stateKey]
            ? "text-green-500"
            : "text-gray-400 hover:text-white"
        }`}
        onClick={() => handleCopy(address, stateKey)}
      />
    </div>
  );

  const HashRow = ({
    label,
    hash,
    stateKey,
    explorerUrl,
  }: {
    label: string;
    hash: string;
    stateKey: keyof typeof copiedStates;
    explorerUrl: string;
  }) => (
    <div className="flex items-center justify-between w-full group !text-sm">
      <div className="flex items-center space-x-2">
        <p className="text-white text-opacity-70">
          <span className="font-bold">{label}</span>: {hash.slice(0, 6)}...
          {hash.slice(-4)}
        </p>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <Copy
        className={`w-4 h-4 ml-2 cursor-pointer transition-colors duration-200 ${
          copiedStates[stateKey]
            ? "text-green-500"
            : "text-gray-400 hover:text-white"
        }`}
        onClick={() => handleCopy(hash, stateKey)}
      />
    </div>
  );

  return (
    <div className="relative">
      <HoverCard open={isHoverCardOpen} onOpenChange={setIsHoverCardOpen}>
        <HoverCardTrigger asChild>
          <span
            className="cursor-pointer flex mt-2 text-white text-opacity-70 flex-row w-full text-sm underline items-center space-x-1"
            onClick={() => {
              setIsHoverCardOpen(!isHoverCardOpen);
            }}
          >
            <p>More Details</p>
            <IoIosArrowDown className="w-4 h-4" />
          </span>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          className="bg-[#282b34] w-96"
          sideOffset={5}
        >
          <p className="text-white text-opacity-80 font-medium flex flex-row">
            <span className="underline underline-offset-2">
              Transaction Details
            </span>
          </p>
          <div className="space-y-1.5 mt-3">
            <AddressRow
              label="Depositor"
              address={txn.depositorAddress}
              stateKey="depositor"
            />
            <AddressRow
              label="Receiver"
              address={txn.receiverAddress}
              stateKey="receiver"
            />
            <HashRow
              label="Source Hash"
              hash={txn.sourceTransactionHash}
              stateKey="sourceHash"
              explorerUrl={getHref(txn.sourceChain, txn.sourceTransactionHash)}
            />
            {txn.destinationTransactionHash && (
              <HashRow
                label="Destination Hash"
                hash={txn.destinationTransactionHash}
                stateKey="destHash"
                explorerUrl={getHref(txn.destinationChain, txn.destinationTransactionHash)}
              />
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
