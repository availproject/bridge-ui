

import type { ApiPromise } from 'avail-js-sdk';
import type { Result } from 'neverthrow';
import { err, ok } from 'neverthrow';

export * from './metamask';
export * from './snap';
export * from './localStorage';
export * from './button';


type TransactionStatus = {
  blockhash: string;
  status: 'success' | 'failed';
  errorInfo?: string;
};

/**
 *
 * @param api
 * @param txHash
 */
export async function checkTransactionStatus(
  api: ApiPromise,
  txHash: string,
  type: "subscribeNewHeads" | "subscribeFinalizedHeads" = "subscribeNewHeads",
): Promise<Result<TransactionStatus, Error>> {
  return new Promise((resolve, reject) => {
    api.rpc.chain
    [type](async (header) => {
        const blockHash = header.hash;
        const signedBlock = await api.rpc.chain.getBlock(blockHash);
        const allEvents = await api.query.system?.events?.at(blockHash);

        const extrinsicsArray = Array.from(signedBlock.block.extrinsics.entries());
        for (const [index, extrinsic] of extrinsicsArray) {
          if (extrinsic.hash.toHex() === txHash) {
            console.log(`Transaction found in block ${header.number}`);

            const transactionEvent = (allEvents as unknown as Array<any>)?.find(
              ({ phase, event }) =>
                phase.isApplyExtrinsic &&
                phase.asApplyExtrinsic.eq(index) &&
                (api.events?.system?.ExtrinsicFailed?.is(event) ||
                  api.events?.system?.ExtrinsicSuccess?.is(event)),
            );

            if (!transactionEvent) {
              resolve(err(new Error('Transaction event not found')));
              return;
            }

            const { event } = transactionEvent;
            if (api.events?.system?.ExtrinsicFailed?.is(event)) {
              const [dispatchError] = event.data;
              let errorInfo: string;
 
              if ((dispatchError as any)?.isModule) {
                const decoded = api.registry.findMetaError(
                  (dispatchError as any).asModule,
                );
                errorInfo = `${decoded.section}.${decoded.name}`;
              } else {
                errorInfo = dispatchError?.toString() ?? 'Unknown error';
              }
              reject(new Error(`Transaction failed with error: ${errorInfo}`));
            } else if (api.events?.system?.ExtrinsicSuccess?.is(event)) {
              console.log('Transaction succeeded!');
              resolve(
                ok({
                  blockhash: blockHash.toHex(),
                  status: 'success',
                }),
              );
            }

            return;
          }
        }
      })
      .catch((subscribeError) => {
        reject(
          err(
            subscribeError instanceof Error
              ? subscribeError
              : new Error('Subscription error'),
          ),
        );
      });
  });
}



