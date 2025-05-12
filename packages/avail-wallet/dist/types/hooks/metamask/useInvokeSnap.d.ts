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
export declare const useInvokeSnap: (snapId?: string) => ({ method, params }: InvokeSnapParams) => Promise<unknown>;
