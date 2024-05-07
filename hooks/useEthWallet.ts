import { useMemo } from "react";
import { ethers } from "ethers";
import { useSwitchChain, useAccount } from "wagmi";

/**
 * @description All the functionalities related to wallet such as connecting, switching network, etc
 */
export default function useEthWallet() {
    const { switchChainAsync } = useSwitchChain();
    const { chainId, address, isConnected } = useAccount();


    const isWalletConnected = useMemo(
        async () => {
            // Check if wallet is connected logic
        },
        [],
    );

    const switchNetwork =
        async (chainId: number) => {
            await switchChainAsync({ chainId: chainId })
        }


    const activeUserAddress = useMemo(
        () => {
            // Get active user address logic
            if(!isConnected) {
                return null
            }
            
            return address
        },
        [chainId],
    );

    const activeNetworkId =
        async () => {
            return chainId
        }

    const provider = useMemo(
        () => {
            // Get ethereum provider logic
        },
        [],
    );

    const ethersProvider = useMemo(
        (): ethers.providers.JsonRpcProvider => {
            return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL);
        },
        [],
    );

    return {
        isWalletConnected,
        activeUserAddress,
        provider,
        ethersProvider,
        activeNetworkId,
        switchNetwork
    };
}