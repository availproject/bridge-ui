/**
 * A Hook to retrieve useful data from MetaMask.
 * @returns The informations.
 */
export declare const useMetaMask: () => {
    isFlask: boolean;
    snapsDetected: boolean;
    installedSnap: import(".").Snap | null;
    getSnap: () => Promise<void>;
    detectMetaMask: () => boolean;
    metamaskInstalled: boolean;
};
