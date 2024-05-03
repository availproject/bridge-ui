import { initialize } from "avail-js-sdk";
import { substrateConfig, ethConfig } from "@/config/walletConfig";
import { getBalance, readContract } from "@wagmi/core";
import { Chain, ethBalance } from "@/types/common";
import { appConfig } from "@/config/default";
import ethereumAvailTokenAbi from "@/constants/abis/ethereumAvailToken.json";
import BigNumber from "bignumber.js";
const networks = appConfig.networks;

export async function _getBalance(chain: Chain, availAddress?: string, ethAddress?: `0x${string}`) : Promise<number> {
  if (chain === Chain.AVAIL && availAddress) {
    const api = await initialize(substrateConfig.endpoint);
    const oldBalance: any = await api.query.system.account(availAddress)
    const intValue = parseInt(oldBalance["data"]["free"].toHuman().replace(/,/g, ''), 10) / Math.pow(10, 18);
    console.log("wow", intValue)
    return intValue;
  }
  if (chain === Chain.ETH && ethAddress) {
    const balance = await readContract(ethConfig, {
      address: appConfig.contracts.ethereum.availToken as `0x${string}`,
      abi: ethereumAvailTokenAbi,
      functionName: "balanceOf",
      args: [ethAddress],
      chainId: networks.ethereum.id,
    });
    if (!balance) return 0;
    //@ts-ignore to be fixed later
    const a: number = parseFloat((BigNumber(balance)/10**18).toFixed(3));
    return a;
  } else {
    return 0;
  }
}




