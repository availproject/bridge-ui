import { Chain, Status } from "./common";

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
        amount: number;
        asset_id: string;
      };
    };
    originDomain: number;
    to: string;
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
      from: `0x${string}`;
      to: `0x${string}`;
      originDomain: number;
      destinationDomain: number;
      id: number;
    };
    accountProof: {};
    storageProof: {};
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
    depositorAddress: `${string}`;
    receiverAddress: `${string}`;
    amount: number;
    message: string;
    dataType: string;
    blockHash: `0x${string}`;
  }
  