import { ApiPromise } from "avail-js-sdk";
import { create } from "zustand";

interface Api {
  api?: ApiPromise;
  isReady: boolean;
  setApi: (api: ApiPromise) => void;
  ensureConnection: (initApiFn: () => Promise<ApiPromise>) => Promise<void>;
}

export const useApi = create<Api>((set, get) => ({
  api: undefined,
  isReady: false,
  setApi: (api) => set({ api }),
  ensureConnection: async (initApiFn) => {
    const currentApi = get().api;

    if (currentApi?.isConnected && (await currentApi.isReady)) {
      set({ isReady: true });
      return;
    }

    try {
      const AvailApi = await initApiFn();
      AvailApi.on("ready", () => {
        set({ isReady: true });
      });

      AvailApi.on("disconnected", async () => {
        set({ isReady: false });
        // Retry connection after disconnection
        setTimeout(() => get().ensureConnection(initApiFn), 5000);
      });

      set({
        api: AvailApi,
        isReady: true,
      });

      return;
    } catch (error) {
      console.error("API_INTIALIZATION_ERROR", error);
      set({ isReady: false });
      // Retry after 5 seconds on failure
      setTimeout(() => get().ensureConnection(initApiFn), 5000);
    }
  },
}));
