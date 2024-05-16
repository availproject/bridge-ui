import { initialize } from "avail-js-sdk";
import { substrateConfig, ethConfig } from "@/config/walletConfig";
import { getBalance, readContract } from "@wagmi/core";
import { Chain } from "@/types/common";
import { appConfig } from "@/config/default";
import ethereumAvailTokenAbi from "@/constants/abis/ethereumAvailToken.json";
import BigNumber from "bignumber.js";
import { toast } from "@/components/ui/use-toast";
import { FaCheckCircle } from "react-icons/fa";
import { CheckCheckIcon, CheckCircle, CheckCircle2Icon, CheckCircleIcon, CheckIcon, ExternalLink } from "lucide-react";
const networks = appConfig.networks;

export async function _getBalance(chain: Chain, availAddress?: string, ethAddress?: `0x${string}`) : Promise<string | undefined> {
  if (chain === Chain.AVAIL && availAddress) {
    const api = await initialize(substrateConfig.endpoint);
    const oldBalance: any = await api.query.system.account(availAddress)    
    
    const intValue = oldBalance["data"]["free"].toHuman().replace(/,/g, '')
    const atomicBalance = intValue.toString()

    return atomicBalance;
  }

  if (chain === Chain.ETH && ethAddress) {
    const balance = await readContract(ethConfig, {
      address: appConfig.contracts.ethereum.availToken as `0x${string}`,
      abi: ethereumAvailTokenAbi,
      functionName: "balanceOf",
      args: [ethAddress],
      chainId: networks.ethereum.id,
    });

    if (!balance) return undefined;
    
    console.log(balance)
    return balance as string;
  } else {
    return 0 as unknown as string;
  }
}


export const showSuccessMessage = ({blockhash, chain}: {
  blockhash: `${string}`,
  chain: Chain
}) => {
  toast({
    title: (
      <div className="flex flex-row items-center justify-center !space-x-3 ">
        <FaCheckCircle className="mr-2"/>
          <p className="mr-2" >Transaction Initiated Successfully</p>
          <a target="_blank"  href={
   chain === Chain.ETH
   ? `https://sepolia.etherscan.io/tx/${blockhash}`
   : `https://explorer.avail.so/#/explorer/query/${blockhash}`
  } ><ExternalLink className="w-4 h-4 text-white text-opacity-75"/></a>
      </div>
    ),
  });
};

export const showFailedMessage = () => {
  toast({
    title: "Transaction failed",
    description: "Please try again",
  });
};




