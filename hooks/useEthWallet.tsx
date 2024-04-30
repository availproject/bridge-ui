import { useMemo } from "react";
import { ethers } from "ethers";
import { useSwitchChain, useAccount } from "wagmi";
import { getChainId, getAccount } from '@wagmi/core'
import { ethConfig } from "@/config";

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
            // Switch network logic
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

    // todo: critical: fix active network id, wagmi is not updating network change
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
            // Get ethers provider logic
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
