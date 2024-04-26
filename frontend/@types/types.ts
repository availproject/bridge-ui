export enum Chain {
  AVAIL = "AVAIL",
  ETH = "ETHEREUM",
}

export interface sendMessageParams {
  message: {
    ArbitraryMessage?: `0x${string}`;
    FungibleToken?: {
      assetId: `0x${string}`;
      amount: number;
    };
  };
  to: `0x${string}`;
  domain: number;
}

export interface executeParams {
  slot: number;
  addrMessage: {
    message: {
      ArbitraryMessage?: `0x${string}`;
      FungibleToken?: {
        assetId: `0x${string}`;
        amount: number;
      };
    };
    from: `0x${string}`;
    to: `0x${string}`;
    originDomain: number;
    destinationDomain: number;
    id: number;
  };
  accountProof: {};
  storageProof: {};
}

export interface TxnData {
  sourceChain: Chain;
  destinationChain: Chain;
  messageId: number;
  status: Status;
  sourceTransactionHash: `0x${string}`;
  sourceTransactionBlockNumber: number;
  sourceTransactionIndex: number;
  sourceTransactionTimestamp: number;
  sourceTokenAddress: `0x${string}`;
  destinationTransactionHash: `0x${string}`;
  destinationTransactionBlockNumber: number;
  destinationTransactionTimestamp: number;
  destinationTransactionIndex: number;
  destinationTokenAddress: `0x${string}`;
  depositorAddress: `0x${string}`;
  receiverAddress: `0x${string}`;
  amount: number;
  message: string;
  dataType: string;
  blockHash: `0x${string}`;
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

//  const result = await api.tx.vector.sendMessage({ ArbitraryMessage: "azeazeaze" },"0x0000000000000000000000000000000000000000000000000000000000000000", 1).signAndSend(keyring, ({ status, events }) => {
//});
