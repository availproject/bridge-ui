import { useCallback, useMemo } from "react";

/**
 * @description All the functionalities related to wallet such as connecting, switching network, etc
 */
export default function useEthWallet() {
   
    const isWalletConnected = useMemo(
        async () => {
            // Check if wallet is connected logic
        },
        [],
    );

    const switchNetwork = useCallback(
        async (chainId: number) => {
            // Switch network logic
        },
        [],
    );

    const activeUserAddress = useMemo(
        async () => {
            // Get active user address logic
        },
        [],
    );

    const activeNetworkId = useMemo(
        () => {
            // Get active network id logic
            return 1
        },
        [],
    );

    return {
        isWalletConnected,
        activeUserAddress,
        activeNetworkId,
        switchNetwork
    };
}
