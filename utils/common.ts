import { initialize } from "avail-js-sdk";
import { substrateConfig, ethConfig } from "@/config/walletConfig";
import { getBalance } from "@wagmi/core";
import { Chain, ethBalance } from "@/types/common";
import { appConfig } from "@/config/default";

export async function _getBalance(chain: Chain, availAddress?: string, ethAddress?: `0x${string}`): Promise<number> {
  if (chain === Chain.AVAIL && availAddress) {
    const api = await initialize(substrateConfig.endpoint);
    const oldBalance: any = await api.query.system.account(availAddress)
    var intValue = parseInt(oldBalance["data"]["free"].toHuman().replace(/,/g, ''), 10) / Math.pow(10, 18);
    return intValue;
  }
  if (chain === Chain.ETH && ethAddress) {
    const balance: ethBalance = await getBalance(ethConfig, {
      address: ethAddress,
      chainId: appConfig.networks.ethereum.id,
    });
    return +(parseFloat(balance.formatted).toFixed(4));
  } else {
    return 0;
  }
}




