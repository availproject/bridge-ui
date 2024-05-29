import { Chain, TransactionStatus } from "./common";

export enum TRANSACTION_TYPES {
  BRIDGE_ETH_TO_AVAIL = "BRIDGE_ETH_TO_AVAIL",
  BRIDGE_AVAIL_TO_ETH = "BRIDGE_AVAIL_TO_ETH",
}

export interface merkleProof {
  blobRoot: string;
  blockHash: string;
  bridgeRoot: string;
  dataRoot: string;
  dataRootCommitment: string;
  dataRootIndex: number;
  dataRootProof: DataRootProof;
  leaf: string;
  leafIndex: number;
  leafProof: LeafProof;
  message: Message;
  rangeHash: string;
}

type Message = {
  destinationDomain: number;
  from: string;
  id: number;
  message: {
    fungibleToken: {
      amount: bigint;
      asset_id: `0x${string}`;
    };
  };
  originDomain: number;
  to: string;
  messageType: string;
};

type DataRootProof = `0x${string}`[];
type LeafProof = `0x${string}`[];

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
    from: `${string}`;
    to: `${string}`;
    originDomain: number;
    destinationDomain: number;
    id: number;
  };
  accountProof: `0x${string}`[];
  storageProof:`0x${string}`[];
}

export interface AccountStorageProof {
  accountProof: `0x${string}`[];
  storageProof: `0x${string}`[];
}

export interface sendMessageParams {
  message: {
    ArbitraryMessage?: `0x${string}`;
    FungibleToken?: {
      assetId: string;
      amount: BigInt;
    };
  };
  to: `${string}`;
  domain: number;
}

export interface Transaction {
  status: TransactionStatus,
  destinationChain: Chain,
  messageId: number,
  sourceChain: Chain,
  amount: string,
  dataType: "ERC20",
  depositorAddress: `0x${string}` | string,
  receiverAddress: string,
  sourceBlockHash: `${string}`,
  sourceTransactionBlockNumber: number,
  sourceTransactionHash: string,
  sourceTransactionIndex: number,
  sourceTransactionTimestamp: string
  sourceTokenAddress?: `0x${string}`;
  destinationTransactionHash?: `0x${string}` | string;
  destinationTransactionBlockNumber?: number;
  destinationTransactionTimestamp?: number;
  destinationTransactionIndex?: number;
  destinationTokenAddress?: `0x${string}`;
  message?: string;
  blockHash?: `0x${string}`;
}
