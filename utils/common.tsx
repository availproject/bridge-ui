import { initialize, isValidAddress } from "avail-js-sdk";
import { substrateConfig, ethConfig } from "@/config/walletConfig";
import { getBalance, readContract } from "@wagmi/core";
import { Chain } from "@/types/common";
import { appConfig } from "@/config/default";
import ethereumAvailTokenAbi from "@/constants/abis/ethereumAvailToken.json";
import BigNumber from "bignumber.js";
import { toast } from "@/components/ui/use-toast";
import { FaCheckCircle } from "react-icons/fa";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { isAddress } from "viem";
import { RxCrossCircled } from "react-icons/rx";
const networks = appConfig.networks;

export async function _getBalance(
  chain: Chain,
  availAddress?: string,
  ethAddress?: `0x${string}`
): Promise<string | undefined> {
  if (chain === Chain.AVAIL && availAddress) {
    const api = await initialize(substrateConfig.endpoint);
    const oldBalance: any = await api.query.system.account(availAddress);

    const intValue = oldBalance["data"]["free"].toHuman().replace(/,/g, "");
    const atomicBalance = intValue.toString();

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

    if (balance === undefined) return undefined;

    console.log(balance);
    return balance as string;
  } else {
    return 0 as unknown as string;
  }
}

export async function validAddress(address: string, chain: Chain) {
  if (chain === Chain.AVAIL) {
    if (isValidAddress(address)) {
      return true;
    } else {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid address",
      });
    }
  }
  if (chain === Chain.ETH) {
    return isAddress(address);
  }
  return false;
}

export const showSuccessMessage = ({
  blockhash,
  chain,
}: {
  blockhash: `${string}`;
  chain: Chain;
}) => {
  toast({
    title: (
      <div className="flex flex-row items-center justify-center !space-x-3 ">
        <FaCheckCircle className="mr-4 h-10 w-10" color="0BDA51" />
        <div className="flex flex-col space-y-2">
          <p className="mr-2 font-thicccboisemibold">
            Transaction Initiated Successfully
          </p>
          <p className="!text-xs !text-white !text-opacity-40 font-thicccboisemibold">
            Your Transaction of was Initiated Successfully.{" "}
            <a
              target="_blank"
              className="flex flex-row underline"
              href={
                chain === Chain.ETH
                  ? `https://sepolia.etherscan.io/tx/${blockhash}`
                  : `https://explorer.avail.so/#/explorer/query/${blockhash}`
              }
            >
              <p>View on Explorer. </p>
              <ArrowUpRight className="h-3 w-6" />
            </a>
          </p>
        </div>
      </div>
    ),
  });
};

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
