import { appConfig } from "@/config/default";
import { TxnLifecyle } from "@/hooks/common/useFinalityTracker";
import { Chain } from "@/types/common";

export const getStepStatus = (step: number, status: TxnLifecyle) => {
    if (step === 1) {
      return status === "submitted" ? "processing" : "done";
    }
    if (step === 2) {
      return status === "included"
        ? "processing"
        : status === "finalised"
        ? "done"
        : "waiting";
    }
    return "waiting";
  };

  export const formatEstimatedTime = (seconds: number) => {
    if (seconds < 40) {
      return "less than a minute";
    } else if (seconds < 60) {
      return "a minute left";
    } else if (seconds < 120) {
      return "~2 minutes";
    } else {
      const minutes = Math.round(seconds / 60);
      return `~ ${minutes} minutes`;
    }
  };

  export const chainToChainId = (chain: Chain) => {
    switch (chain) {
      case Chain.ETH:
        return appConfig.networks.ethereum.id;
      case Chain.BASE:
        return appConfig.networks.base.id;
      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }
  }

  export const chainToAddresses = (chain: Chain) => {
    switch (chain) {
      case Chain.ETH:
        return {
          tokenAddress: appConfig.contracts.ethereum.availToken,
          bridgeAddress: appConfig.contracts.ethereum.bridge,
          liquidityBridgeAddress: appConfig.contracts.ethereum.liquidityBridgeAddress,
        }
      case Chain.BASE:
        return {
          tokenAddress: appConfig.contracts.base.availToken,
          liquidityBridgeAddress: appConfig.contracts.base.liquidityBridgeAddress,
        }
      case Chain.AVAIL:
        return {
          liquidityBridgeAddress: appConfig.contracts.avail.liquidityBridgeAddress,
        }
      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }
  }