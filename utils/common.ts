import {
  ApiPromise,
  disconnect,
  initialize,
  isValidAddress,
} from "avail-js-sdk";
import { ethConfig, substrateConfig } from "@/config/walletConfig";
import { readContract } from "@wagmi/core";
import { Chain } from "@/types/common";
import { appConfig } from "@/config/default";
import ethereumAvailTokenTuring from "@/constants/abis/ethereumAvailTokenTuring.json";
import ethereumAvailTokenMainnet from "@/constants/abis/ethereumAvailTokenMainnet.json";
import { isAddress } from "viem";
import { Logger } from "./logger";

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
          const balance = await readContract(ethConfig, {
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

export async function validAddress(address: string, chain: Chain) {
  if (chain === Chain.AVAIL) {
    return isValidAddress(address);
  }
  if (chain === Chain.ETH) {
    return isAddress(address);
  }
  return false;
}

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
