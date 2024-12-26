import { appConfig } from "@/config/default";
import { Chain } from "@/types/common";
import { useMemo } from "react";
import { useSwitchChain, useAccount } from "wagmi";

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

  return {
    activeUserAddress,
    activeNetworkId,
    validateandSwitchChain,
  };
}
