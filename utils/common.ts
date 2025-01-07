import {
  ApiPromise,
  disconnect,
  initialize,
  isValidAddress,
  Keyring,
} from "avail-js-sdk";
import { substrateConfig } from "@/config/walletConfig";
import { Chain, TransactionStatus } from "@/types/common";
import { isAddress } from "viem";
import { parseMinutes } from "./parsers";
import { ethers } from "ethers";
import { LatestBlockInfo } from "@/stores/blockinfo";

 //In milliseconds - 20 minutes.
export const TELEPATHY_INTERVAL = 1200000;
 //In milliseconds - 120 minutes.
export const VECTORX_INTERVAL = 7200000;
export const decimal_points = 2

export const nini = (sec: number) =>
  new Promise((resolve) => setTimeout(resolve, sec * 1000));


export function validAddress(address: string, chain: Chain) {
  if (chain === Chain.AVAIL) {
    return isValidAddress(address);}
  return isAddress(address);
}

export function getHref(chain: Chain, txnHash: string) {
  switch (chain) {
    case Chain.AVAIL:
      return `${process.env.NEXT_PUBLIC_SUBSCAN_URL}/extrinsic/${txnHash}`
    case Chain.ETH:
      return `${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL}/tx/${txnHash}`
    case Chain.BASE:
      return `${process.env.NEXT_PUBLIC_BASE_EXPLORER_URL}/tx/${txnHash}`
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}

export const getStatusTime = ({
  from,
  to,
  status,
  heads: { eth: ethHead, avl: avlHead },
  SourceTimestamp,
}: {
  from: Chain;
  to: Chain
  status: TransactionStatus;
  heads: { eth: LatestBlockInfo["ethHead"]; avl: LatestBlockInfo["avlHead"] };
  SourceTimestamp: string
}) => {

  if (status === "READY_TO_CLAIM") {
    return "~";
  }
  if (status === "INITIATED") {
    return "Waiting for finalisation";
  }
  if (status === "PENDING") {
    return "~5 minutes";
  }
  
  if(from === Chain.BASE || to === Chain.BASE) {
    const timeNow = Date.now();
    const txnTimestamp = new Date(SourceTimestamp).getTime();
    const BASE_TIME_CONSTANT = 20 * 60 * 1000
    const timeLeft = (txnTimestamp + BASE_TIME_CONSTANT)  - timeNow;

    if (timeLeft < 0) {
      return `—`
    }

    return `~${parseMinutes(timeLeft / 1000 / 60)}`;
  }

  if (from === Chain.ETH) {
    const lastProofTimestamp = ethHead.timestamp * 1000;
    const nextProofTimestamp = lastProofTimestamp + TELEPATHY_INTERVAL;
    const timeNow = Date.now();
    const timeLeft = nextProofTimestamp - timeNow;

    if (timeLeft < 0) {
      return `—`
    }

    return `~${parseMinutes(timeLeft / 1000 / 60)}`;
  }

  if (from === Chain.AVAIL) {
    const lastProofTimestamp = avlHead.data.endTimestamp;
    const nextProofTimestamp = lastProofTimestamp + VECTORX_INTERVAL;
    const timeNow = Date.now();
    const timeLeft = nextProofTimestamp - timeNow;

    if (timeLeft < 0) {
      return `—`
    }

    return `~${parseMinutes(timeLeft / 1000 / 60)}`;
  }
};

export const initApi = async (retries = 3): Promise<ApiPromise> => {
  try {
    console.log(`Initializing API. Retries left: ${retries}`);
    const initializedApi = await initialize(substrateConfig.endpoint);
    return initializedApi;
  } catch (error) {
    disconnect();
    if (retries > 0) {
      await nini(2);
      console.debug(`Retrying to initialize API. Retries left: ${retries}`);
      return initApi(retries - 1);
    } else {
      throw new Error(`RPC_INITIALIZE_ERROR: ${error}`);
    }
  }
};

export const stringToByte32 = (str: string) => {
    return ethers.utils.keccak256(str);
}

function uint8ArrayToByte32String(uint8Array: Uint8Array) {
    if (!(uint8Array instanceof Uint8Array)) {
        throw new Error('Input must be a Uint8Array');
    }
    let hexString = '';
    for (const byte of uint8Array as any) {
        hexString += byte.toString(16).padStart(2, '0');
    }
    if (hexString.length !== 64) {
        throw new Error('Input must be 32 bytes long');
    }
    return '0x' + hexString;
}

export const substrateAddressToPublicKey = (address: string) => {
    const accountId = address;
    const keyring = new Keyring({ type: 'sr25519' });

    const pair = keyring.addFromAddress(accountId);
    const publicKeyByte8Array = pair.publicKey
    const publicKeyByte32String = uint8ArrayToByte32String(publicKeyByte8Array);

    return publicKeyByte32String;
}
