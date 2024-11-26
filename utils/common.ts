import {
  ApiPromise,
  disconnect,
  initialize,
  isValidAddress,
} from "avail-js-sdk";
import { config, substrateConfig } from "@/config/walletConfig";
import { readContract } from "@wagmi/core";
import { Chain, TransactionStatus } from "@/types/common";
import { appConfig } from "@/config/default";
import ethereumAvailTokenTuring from "@/constants/abis/ethereumAvailTokenTuring.json";
import ethereumAvailTokenMainnet from "@/constants/abis/ethereumAvailTokenMainnet.json";
import { isAddress } from "viem";
import { Logger } from "./logger";
import { parseMinutes } from "./parsers";
import { LatestBlockInfo } from "@/stores/lastestBlockInfo";

const networks = appConfig.networks;

export async function _getBalance(
  chain: Chain,
  api: ApiPromise,
  availAddress?: string,
  ethAddress?: `0x${string}`
): Promise<string | undefined> {
  try {
    switch (chain) {
      case Chain.AVAIL:
        if (availAddress) {
          const oldBalance: any = await api.query.system.account(availAddress);
          const atomicBalance =
            oldBalance.data.free.toHuman().replace(/,/g, "") -
            oldBalance.data.frozen.toHuman().replace(/,/g, "");
          return atomicBalance.toString();
        }
        break;

      case Chain.ETH:
        if (ethAddress) {
          const balance = await readContract(config, {
            address: appConfig.contracts.ethereum.availToken as `0x${string}`,
            abi:
              process.env.NEXT_PUBLIC_ETHEREUM_NETWORK === "mainnet"
                ? ethereumAvailTokenMainnet
                : ethereumAvailTokenTuring,
            functionName: "balanceOf",
            args: [ethAddress],
            chainId: networks.ethereum.id,
          });
          if (balance === undefined) return undefined;
          return balance as string;
        }
        break;

      default:
        throw new Error("INVALID_CHAIN");
    }
  } catch (error) {
    Logger.error(`ERROR_FETCHING_BALANCE: ${error}`);
  }
}

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

export const nini = (sec: number) =>
  new Promise((resolve) => setTimeout(resolve, sec * 1000));

export const initApi = async (retries = 3): Promise<ApiPromise> => {
  try {
    const initializedApi = await initialize(substrateConfig.endpoint);
    return initializedApi;
  } catch (error) {
    disconnect();
    if (retries > 0) {
      await nini(2);
      Logger.debug(`Retrying to initialize API. Retries left: ${retries}`);
      return initApi(retries - 1);
    } else {
      throw new Error(`RPC_INITIALIZE_ERROR: ${error}`);
    }
  }
};


  //In milliseconds - 20 minutes.
  export const TELEPATHY_INTERVAL = 1200000;
  //In milliseconds - 120 minutes.
  export const VECTORX_INTERVAL = 7200000;