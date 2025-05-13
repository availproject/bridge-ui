import {
  Wallet,
  WalletAccount,
  getWalletBySource,
} from "@talismn/connect-wallets";
import { ApiPromise } from "avail-js-sdk";
import { UpdateMetadataParams } from "./types";
import { initialize, disconnect } from "avail-js-sdk";

/**
 * @description Get injected metadata for extrinsic call
 *
 * @param api
 * @returns injected metadata
 */
export const getInjectorMetadata = (api: ApiPromise) => {
  return {
    chain: api.runtimeChain.toString(),
    specVersion: api.runtimeVersion.specVersion.toNumber(),
    tokenDecimals: api.registry.chainDecimals[0] || 18,
    tokenSymbol: api.registry.chainTokens[0] || "AVAIL",
    genesisHash: api.genesisHash.toHex(),
    ss58Format:
      typeof api.registry.chainSS58 === "number" ? api.registry.chainSS58 : 0,
    chainType: "substrate" as "substrate",
    icon: "substrate",
    types: {} as any,
    userExtensions: [] as any,
  };
};

export async function updateMetadata({
  api,
  account,
  metadataCookie,
  selectedWallet,
  setCookie,
}: UpdateMetadataParams) {
  const injector = getWalletBySource(account.source);

  let retriedApiConn: ApiPromise | null = null;
  let showError: Function | null = null;

  if (!api || !api.isConnected || !(await api.isReady)) {
    console.debug("API not ready, cannot update metadata");
    return;
  }

  if (
    injector &&
    (!metadataCookie ||
      (metadataCookie ? metadataCookie.wallet !== selectedWallet.title : true))
  ) {
    try {
      const metadata = getInjectorMetadata(api);
      await injector.extension.metadata.provide(metadata);
      setCookie(
        "metadataUpdated",
        {
          wallet: selectedWallet.title,
          updated: true,
        },
        {}
      );
    } catch (e) {
      console.error("Failed to update metadata", e);
    }
  }
}

export const initApi = async (
  rpcUrl: string,
  retries = 3,
): Promise<ApiPromise> => {
  try {
    console.log(`Initializing API. Retries left: ${retries}`);
    const initializedApi = await initialize(rpcUrl);
    return initializedApi;
  } catch (error) {
    disconnect();
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.debug(`Retrying to initialize API. Retries left: ${retries}`);
      return initApi(rpcUrl, retries - 1);
    } else {
      throw new Error(`RPC_INITIALIZE_ERROR: ${error}`);
    }
  }
};
