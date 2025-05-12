
import { defaultSnapOrigin } from '.';

// Define the Request type inline
type Request = (params: { method: string; params?: any }) => Promise<unknown | null>;

// Create a minimal useRequest hook
const useRequest = (): Request => {
  return async ({ method, params }) => {
    try {
      // Get window.ethereum if available
      const ethereum = (window as any).ethereum;
      if (!ethereum) return null;
      
      const data = await ethereum.request({
        method,
        params,
      });
      
      return data || null;
    } catch (error) {
      console.error('Request error:', error);
      return null;
    }
  };
};

export type InvokeSnapParams = {
  method: string;
  params?: Record<string, unknown>;
};

/**
 * Utility hook to wrap the `wallet_invokeSnap` method.
 *
 * @param snapId - The Snap ID to invoke. Defaults to the snap ID specified in the
 * config.
 * @returns The invokeSnap wrapper method.
 */
export const useInvokeSnap = (snapId = defaultSnapOrigin) => {
  const request = useRequest();

  /**
   * Invoke the requested Snap method.
   *
   * @param params - The invoke params.
   * @param params.method - The method name.
   * @param params.params - The method params.
   * @returns The Snap response.
   */
  const invokeSnap = async ({ method, params }: InvokeSnapParams) =>
    request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: params ? { method, params } : { method },
      },
    });

  return invokeSnap;
};