import type { RequestArguments } from '@metamask/providers';
export type Request = (params: RequestArguments) => Promise<unknown | null>;
/**
 * Utility hook to consume the provider `request` method with the available provider.
 *
 * @returns The `request` function.
 */
export declare const useRequest: () => Request;
