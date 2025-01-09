export interface WormholeTransaction {
  id: string;
  emitterChain: number;
  emitterAddress: EmitterAddress;
  sequence: string;
  vaa: Vaa;
  content: Content;
  sourceChain: SourceChain;
  targetChain: TargetChain;
}

interface TargetChain {
  chainId: number;
  timestamp: string;
  transaction: Transaction;
  status: string;
  from: string;
  to: string;
  fee: string;
  gasTokenNotional: string;
  feeUSD: string;
}

interface SourceChain {
  chainId: number;
  timestamp: string;
  transaction: Transaction;
  from: string;
  status: string;
  fee: string;
  gasTokenNotional: string;
  feeUSD: string;
}

interface Transaction {
  txHash: string;
}

interface Content {
  payload: Payload;
  standarizedProperties: StandarizedProperties;
}

interface StandarizedProperties {
  appIds: string[];
  fromChain: number;
  fromAddress: string;
  toChain: number;
  toAddress: string;
  tokenChain: number;
  tokenAddress: string;
  amount: string;
  feeAddress: string;
  feeChain: number;
  fee: string;
  normalizedDecimals: number;
}

interface Payload {
  encodedExecutionInfo: EncodedExecutionInfo;
  extraReceiverValue: string;
  messageKeys: any[];
  parsedPayload: ParsedPayload;
  payload: string;
  payloadType: number;
  refundAddress: string;
  refundChainId: number;
  refundDeliveryProvider: string;
  requestedReceiverValue: string;
  senderAddress: string;
  sourceDeliveryProvider: string;
  targetAddress: string;
  targetChainId: number;
}

interface ParsedPayload {
  nttManagerMessage: NttManagerMessage;
  nttMessage: NttMessage;
  transceiverMessage: TransceiverMessage;
}

interface TransceiverMessage {
  prefix: string;
  recipientNttManager: string;
  sourceNttManager: string;
  transceiverPayload: string;
}

interface NttMessage {
  additionalPayload: string;
  sourceToken: string;
  to: string;
  toChain: number;
  trimmedAmount: TrimmedAmount;
}

interface TrimmedAmount {
  amount: string;
  decimals: number;
}

interface NttManagerMessage {
  id: string;
  sender: string;
}

interface EncodedExecutionInfo {
  gasLimit: string;
  targetChainRefundPerGasUnused: string;
}

interface Vaa {
  raw: string;
  guardianSetIndex: number;
  isDuplicated: boolean;
}

interface EmitterAddress {
  hex: string;
  native: string;
}