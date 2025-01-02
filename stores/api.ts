import { initApi } from "@/utils/common";
import { ApiPromise } from "avail-js-sdk";
import { create } from "zustand";

interface Api {
    api?: ApiPromise
    isReady: boolean;
    setApi: (api: ApiPromise) => void;
    ensureConnection: () => Promise<void>;
  }
  
  export const useApi = create<Api>((set, get) => ({
    api: undefined,
    isReady: false,
    setApi: (api) => set({ api }),
    ensureConnection: async () => {
      const currentApi = get().api;
      
      if (currentApi?.isConnected && await currentApi.isReady) {
        set({ isReady: true });
        return;
      }
  
      try {
        const AvailApi = await initApi();
        AvailApi.on('ready', () => {
          set({ isReady: true });
        });
  
        AvailApi.on('disconnected', async () => {
          set({ isReady: false });
          get().ensureConnection();
        });
  
        set({ 
          api: AvailApi, 
          isReady: true 
        });

        return;
      } catch (error) {
        console.error('API_INTIALIZATION_ERROR', error);
        set({ isReady: false });
        setTimeout(() => get().ensureConnection(), 5000);
      }
    }
  }));