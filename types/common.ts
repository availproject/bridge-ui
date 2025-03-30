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