import { appConfig } from "@/config/default";
import { config } from "@/config/walletConfig";
import { Chain } from "@/types/common";
import { readContract } from "@wagmi/core";
import { useCallback, useMemo } from "react";
import { useSwitchChain, useAccount } from "wagmi";
import availTokenAbi from "@/constants/abis/availTokenAbi.json";
import BigNumber from "bignumber.js";
import { chainToAddresses } from "@/components/common/utils";

/**
 * @desc All the functionalities related to wallet such as connecting, switching network, etc
 */
export default function useEthWallet() {
  const { switchChainAsync } = useSwitchChain();
  const { chainId, address, isConnected } = useAccount();

  const switchNetwork = async (chainId: number) => {
    await switchChainAsync({ chainId: chainId });
  };

  const activeUserAddress = useMemo(() => {
    if (!isConnected) {
      return null;
    }

    return address;
  }, [address, isConnected]);

  const activeNetworkId = useMemo(() => {
    return chainId;
  }, [chainId]);

  const validateandSwitchChain = async (targetChain: Chain) => {
    switch (targetChain) {
      case Chain.ETH: {
        if ((activeNetworkId) !== appConfig.networks.ethereum.id) {
          console.log("switching to eth");
          await switchNetwork(appConfig.networks.ethereum.id);
        }
        break;
      }
      case Chain.BASE: {
        if ((activeNetworkId) !== appConfig.networks.base.id) {
          console.log("switching to base");
          await switchNetwork(appConfig.networks.base.id);
        }
        break;
      }
      case Chain.AVAIL: {
        break;
      }
      default:
        throw new Error(`Unsupported chain: ${targetChain}`);
    }
  };

    const getERC20AvailBalance = useCallback(async (Chain: Chain) => {

      const balance = await readContract(config, {
        address: chainToAddresses(Chain).tokenAddress as `0x${string}`,
        abi: availTokenAbi,
        functionName: "balanceOf",
        args: [activeUserAddress],
        chainId
      });
  
      if (!balance) return new BigNumber(0);
  
      //@ts-ignore TODO: P2
      return new BigNumber(balance);
    }, [activeUserAddress, chainId]);

  return {
    activeUserAddress,
    activeNetworkId,
    validateandSwitchChain,
    getERC20AvailBalance
  };
}
