import { Chain as WhChain } from "@wormhole-foundation/sdk";

export enum Chain {
  AVAIL = "AVAIL",
  ETH = "ETHEREUM",
  BASE = "BASE",
}

export enum TransactionStatus {
  INITIATED = "INITIATED",
  BRIDGED = "BRIDGED",
  READY_TO_CLAIM = "READY_TO_CLAIM",
  CLAIMED = "CLAIMED",
  FAILED = "FAILED",
  CLAIM_PENDING = "PENDING",
  PENDING = "PENDING",
  ERROR = "ERROR",
}

export interface ethBalance {
  decimals: number;
  formatted: string;
  symbol: string;
  value: BigInt;
}

export type CheckedState = boolean | "indeterminate";

export interface LiquidityBridgeTransactionBody {
  sender_address: string;
  tx_index: number;
  block_hash: string;
  eth_receiver_address: string;
  amount: string;
}

export interface PayloadResponse {
  id: number;
  amount: string;
  block_hash: string;
  eth_receiver_address: string;
  sender_address: string;
  tx_index: number;
  status: "InProgress" | "Completed" | "Failed";
}

export function whChainToChain(whChain: WhChain): Chain {
  switch (whChain) {
    case "Base":
    case "BaseSepolia":
      return Chain.BASE;
    case "Ethereum":
    case "Sepolia":
      return Chain.ETH;
    default:
      throw new Error(`Unsupported Wormhole chain: ${whChain}`);
  }
}

export function chainToWhChain(chain: Chain, isMainnet: boolean): WhChain {
  switch (chain) {
    case Chain.BASE:
      return isMainnet ? "Base" : "BaseSepolia";
    case Chain.ETH:
      return isMainnet ? "Ethereum" : "Sepolia";
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}