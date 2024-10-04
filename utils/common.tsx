import { ApiPromise, isValidAddress } from "avail-js-sdk";
import { ethConfig } from "@/config/walletConfig";
import { readContract } from "@wagmi/core";
import { Chain } from "@/types/common";
import { appConfig } from "@/config/default";
import ethereumAvailTokenTuring from "@/constants/abis/ethereumAvailTokenTuring.json";
import ethereumAvailTokenMainnet from "@/constants/abis/ethereumAvailTokenMainnet.json";
import { toast } from "@/components/ui/use-toast";
import { FaCheckCircle } from "react-icons/fa";
import { ArrowUpRight } from "lucide-react";
import { isAddress } from "viem";
import { RxCrossCircled } from "react-icons/rx";
import { Logger } from "./logger";
const networks = appConfig.networks;

export async function _getBalance(
  chain: Chain,
  api: ApiPromise,
  availAddress?: string,
  ethAddress?: `0x${string}`,
): Promise<string | undefined> {
  if (chain === Chain.AVAIL && availAddress) {
    try {
      const oldBalance: any = await api.query.system.account(availAddress);
      const atomicBalance =  oldBalance.data.free.toHuman().replace(/,/g, "") - oldBalance.data.frozen.toHuman().replace(/,/g, "")
       return atomicBalance.toString();
    } catch (error) {
      Logger.error(`ERROR_FETCHING_BALANCE: ${error}`);
    }
  }

  if (chain === Chain.ETH && ethAddress) {
    const balance = await readContract(ethConfig, {
      address: appConfig.contracts.ethereum.availToken as `0x${string}`,
      abi: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK === "mainnet" ? ethereumAvailTokenMainnet : ethereumAvailTokenTuring,
      functionName: "balanceOf",
      args: [ethAddress],
      chainId: networks.ethereum.id,
    });

    if (balance === undefined) return undefined;

    Logger.info(`This is address balance: ${balance}`);
    return balance as string;
  } else {
    return 0 as unknown as string;
  }
}


/**
 * @description check if the address is valid
 * @param address 
 * @param chain 
 * @returns boolean
 */
export async function validAddress(address: string, chain: Chain) {
  if (chain === Chain.AVAIL) {
    if (isValidAddress(address)) {
      return true;
    } else {
    return false;
    }
  }
  if (chain === Chain.ETH) {
    return isAddress(address);
  }
  return false;
}

/**
 * @description success toast message
 */
export const showSuccessMessage = ({
  blockhash,
  txHash,
  chain,
  title,
  desc,
}: {
  blockhash?: `${string}`;
  txHash?: string;
  chain?: Chain;
  title?: string;
  desc?: string;
}) => {
  toast({
    title: (
      <div className="flex flex-row items-center justify-center !space-x-3 ">
        <FaCheckCircle className="mr-4 h-10 w-10" color="0BDA51" />
        <div className="flex flex-col space-y-2">
          <p className="mr-2 font-thicccboisemibold">
            {title ? title : "Transaction Initiated Successfully"}
          </p>
          <p className="!text-xs !text-white !text-opacity-40 font-thicccboisemibold">
            {desc ? desc : "Your Transaction of was Initiated Successfully."}
            {blockhash && <a
              target="_blank"
              className="flex flex-row underline"
              href={
                chain === Chain.ETH
                  ? `${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL}/tx/${blockhash}`
                  : `${process.env.NEXT_PUBLIC_SUBSCAN_URL}/extrinsic/${txHash}`
              }
            >
              <p>View on Explorer. </p>
              <ArrowUpRight className="h-3 w-6" />
            </a>}
          </p>
        </div>
      </div>
    ),
  });
};

/**
 * @description failed toast message
 */
export const showFailedMessage = ({title, description} : {title: string, description?: string}) => {
  toast({
    title: (
      <div className="flex flex-row items-center justify-center !space-x-3 ">
        <RxCrossCircled className="mr-4 h-10 w-10" color="FF0000" />
        <div className="flex flex-col space-y-2">
          <p className="mr-2 font-thicccboisemibold">
            Transaction Failed
          </p>
          <p className="!text-xs !text-white !text-opacity-40 font-thicccboisemibold">
           {title ? title :  "Your Transaction has failed due to some error. Please try again later."} 
          </p>
        </div>
      </div>
    ),
  });
};
