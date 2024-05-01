export enum Chain {
    AVAIL = "AVAIL",
    ETH = "ETHEREUM",
  }

  
export enum TransactionFlow {
    ETH_TO_AVAIL = "ETH_TO_AVAIL",
    AVAIL_TO_ETH = "AVAIL_TO_ETH",
}

export enum Status {
    INITIALIZED = "INITIALIZED",
    BRIDGED = "BRIDGED",
    READY_TO_CLAIM = "READY_TO_CLAIM",
    CLAIMED = "CLAIMED",
  }
  
  export interface ethBalance {
    decimals: number;
    formatted: string;
    symbol: string;
    value: BigInt;
  }
  
