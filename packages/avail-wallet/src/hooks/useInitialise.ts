import { ApiPromise, disconnect, initialize } from "avail-js-sdk";
import { useApi } from "avail-wallet";

const useInitialise = () => {
  const { ensureConnection } = useApi();

  const initApi = async (rpcUrl: string, retries = 3): Promise<ApiPromise> => {
    try {
      console.log(`Initializing API. Retries left: ${retries}`);
      const initializedApi = await initialize(rpcUrl);
      return initializedApi;
    } catch (error) {
      disconnect();
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.debug(`Retrying to initialize API. Retries left: ${retries}`);
        return initApi(rpcUrl, retries - 1);
      } else {
        throw new Error(`RPC_INITIALIZE_ERROR: ${error}`);
      }
    }
  };

  const initializeApi = async (rpcUrl?: string) => {
    const test = false;
    if (!rpcUrl || !test) return;

    await ensureConnection(() => initApi(rpcUrl!));
  };

  return { initializeApi };
};

export default useInitialise;
