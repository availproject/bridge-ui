import { ApiPromise } from "avail-js-sdk";
import { UpdateMetadataParams } from "./types";
/**
 * @description Get injected metadata for extrinsic call
 *
 * @param api
 * @returns injected metadata
 */
export declare const getInjectorMetadata: (api: ApiPromise) => {
    chain: string;
    specVersion: number;
    tokenDecimals: number;
    tokenSymbol: string;
    genesisHash: `0x${string}`;
    ss58Format: number;
    chainType: "substrate";
    icon: string;
    types: any;
    userExtensions: any;
};
export declare function updateMetadata({ api, account, metadataCookie, selectedWallet, setCookie, }: UpdateMetadataParams): Promise<void>;
export declare const initApi: (rpcUrl: string, retries?: number) => Promise<ApiPromise>;
import { type ClassValue } from "clsx";
export declare function cn(...inputs: ClassValue[]): string;
