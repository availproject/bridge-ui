 
import { toast } from "@/components/ui/use-toast";
import { isNumber } from "@polkadot/util";
import {
  ApiPromise,
  getKeyringFromSeed,
  initialize,
  isValidAddress,
  rpc, types, TURING_ENDPOINT,signedExtensions 
} from "avail-js-sdk";
import { substrateConfig, ethConfig } from "@/config/walletConfig";
import { getBalance } from "@wagmi/core";
import { WalletAccount } from "@talismn/connect-wallets";
import { SignerOptions } from "@polkadot/api/types";
import { encodeAbiParameters } from 'viem'
import { web3Enable } from "@polkadot/extension-dapp";
import { executeParams, sendMessageParams, TxnData } from "@/types/transaction";
import { Chain, ethBalance } from "@/types/common";
import { appConfig } from "@/config/default";





export async function _getBalance(chain: Chain, availAddress?: string, ethAddress?: `0x${string}`) : Promise<number> {
  if (chain === Chain.AVAIL && availAddress) {
    const api = await initialize(substrateConfig.endpoint);
    const oldBalance: any = await api.query.system.account(availAddress)
    var intValue = parseInt(oldBalance["data"]["free"].toHuman().replace(/,/g, ''), 10)/ Math.pow(10, 18);
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




