import { ApiPromise } from "avail-js-sdk";
interface Api {
    api?: ApiPromise;
    isReady: boolean;
    setApi: (api: ApiPromise) => void;
    ensureConnection: (initApiFn: () => Promise<ApiPromise>) => Promise<void>;
}
export declare const useApi: import("zustand").UseBoundStore<import("zustand").StoreApi<Api>>;
export {};
