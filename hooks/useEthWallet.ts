import { useMemo } from "react";
import { useSwitchChain, useAccount } from "wagmi";

/**
 * @description All the functionalities related to wallet such as connecting, switching network, etc
 */
export default function useEthWallet() {
    const { switchChainAsync } = useSwitchChain();
    const { chainId, address, isConnected } = useAccount();

    const switchNetwork =
        async (chainId: number) => {
            await switchChainAsync({ chainId: chainId })
        }


    const activeUserAddress = useMemo(
        () => {
            if(!isConnected) {
                return null
            }
            
            return address
        },
        [address, isConnected],
    );

    const activeNetworkId =
        async () => {
            return chainId
        }



    return {
        activeUserAddress,
        activeNetworkId,
        switchNetwork
    };
}
