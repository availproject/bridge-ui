import {
  ApiPromise,
  disconnect,
  initialize,
  isValidAddress,
} from "avail-js-sdk";
import { substrateConfig } from "@/config/walletConfig";
import { Chain, TransactionStatus } from "@/types/common";
import { isAddress } from "viem";
import { Logger } from "./logger";
import { parseMinutes } from "./parsers";
import { LatestBlockInfo } from "@/stores/lastestBlockInfo";
import { appConfig } from "@/config/default";



 //In milliseconds - 20 minutes.
 export const TELEPATHY_INTERVAL = 1200000;
 //In milliseconds - 120 minutes.
 export const VECTORX_INTERVAL = 7200000;
 const networks = appConfig.networks;

 export const nini = (sec: number) =>
  new Promise((resolve) => setTimeout(resolve, sec * 1000));


export function validAddress(address: string, chain: Chain) {
  if (chain === Chain.AVAIL) {
    return isValidAddress(address);
  }
  if (chain === Chain.ETH) {
    return isAddress(address);
  }
  return false;
}

export function getHref(destinationChain: Chain, txnHash: string) {
  if(destinationChain === Chain.AVAIL) {
     return `${process.env.NEXT_PUBLIC_SUBSCAN_URL}/extrinsic/${txnHash}`
  } else {
     return  `${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL}/tx/${txnHash}`
  }
}

export const getStatusTime = ({
  from,
  status,
  heads: { eth: ethHead, avl: avlHead },
}: {
  from: Chain;
  status: TransactionStatus;
  heads: { eth: LatestBlockInfo["ethHead"]; avl: LatestBlockInfo["avlHead"] };
}) => {
  if (status === "READY_TO_CLAIM") {
    return "~";
  }
  if (status === "INITIATED") {
    return "Waiting for finalisation";
  }

  //TODO: Change below to more accurate time
  if (status === "PENDING" && from === Chain.ETH) {
    return "~15 minutes";
  }

  //TODO: Change below to more accurate time
  if (status === "PENDING" && from === Chain.AVAIL) {
    return "~5 minutes";
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
    console.log("API initialized", initializedApi);
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