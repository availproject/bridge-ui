import { Snap } from "@/hooks/metamask/types";
import { getInjectorMetadata } from "@/services/pallet";
import { initApi } from "@/utils/common";
import { Logger } from "@/utils/logger";
import { showFailedMessage } from "@/utils/toasts";
import { getWalletBySource, Wallet, WalletAccount } from "@talismn/connect-wallets";
import { ApiPromise } from "avail-js-sdk";


export async function updateMetadata({
    api, 
    account,
    metadataCookie,
    selectedWallet,
    setCookie
} : {
    api: ApiPromise | undefined;
    account: WalletAccount;
    metadataCookie: any;
    selectedWallet: Wallet;
    setCookie: Function
})  {

    const injector = getWalletBySource(account.source);

    let retriedApiConn: ApiPromise | null = null;

    if (!api || !api.isConnected || !api.isReady) {
      Logger.debug("Retrying API Conn");
      retriedApiConn = await initApi();
      if (!retriedApiConn || !retriedApiConn.isConnected) {
        showFailedMessage({
          title:
            "Failed to connect to Avail Rpc, please try again later.",
        });
      }
    }
          
    if (
      injector &&
      (!metadataCookie ||
        (metadataCookie
          ? metadataCookie.wallet !==
              selectedWallet.title
          : true))
    ) {
      try {
        const metadata = getInjectorMetadata(
          (api ? api : retriedApiConn)!
        );
        await injector.extension.metadata.provide(metadata);
        setCookie(
          "metadataUpdated",
          {
            wallet: selectedWallet.title,
            updated: true,
          },
          {
            path: "/",
            sameSite: true,
          }
        );
      } catch (e) {
        showFailedMessage({
          title:
            "Failed to update Metadata, Transactions may fail",
        });
      }
    }

}