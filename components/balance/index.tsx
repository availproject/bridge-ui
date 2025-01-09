"use client";

import { useApi } from "@/stores/api";
import { useBalanceStore } from "@/stores/balances";
import { Chain } from "@/types/common";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BalanceProps {
  chain: Chain;
  address?: string;
  className?: string;
}

export const Balance = ({ chain, address, className = "" }: BalanceProps) => {
  const { balances, fetchBalance } = useBalanceStore();
  const { api } = useApi();
  const { status, value, error } = balances[chain];

  useEffect(() => {
    if (!address || !chain) return;
    if (chain !== Chain.AVAIL || api?.isReady) {
      fetchBalance(address, chain, api);
      const interval = setInterval(
        () => fetchBalance(address, chain, api),
        30000
      );
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chain, api?.isReady]);

  if (!address) return <div></div>;

  if (status === "loading" || (chain === Chain.AVAIL && !api?.isReady)) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-white/70">Balance</span>
        <div className="h-4 w-12 bg-gray-600 animate-pulse rounded" />
        <div className="h-4 w-10 bg-gray-600 animate-pulse rounded" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="flex items-center gap-1 justify-center">
            <span className="text-red-400 ml-1">Balance</span>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </TooltipTrigger>
          <TooltipContent className="text-red-400 bg-[#3A3E4A] !border-0">
            <p>ERROR: {error || "Failed to fetch balance"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-white/70 ml-1">Balance</span>
      <span className="text-white mx-1">
        {value} AVAIL
      </span>
    </div>
  );
};
