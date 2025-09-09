import { isNumber, stringToHex, stringToU8a, u8aToHex } from "@polkadot/util";
import { ApiPromise, types, signedExtensions } from "avail-js-sdk";
import { getWalletBySource, WalletAccount } from "@talismn/connect-wallets";
import { executeParams, sendMessageParams } from "@/types/transaction";
import { Logger } from "@/utils/logger";
import { Result, err, ok } from "neverthrow";
import { ISubmittableResult, Signer } from "@polkadot/types/types";
import { chainToAddresses } from "@/components/common/utils";
import { Chain } from "@/types/common";
import { signatureVerify } from "@polkadot/util-crypto";

export interface LegacySignerOptions {
  app_id: number;
  signer?: Signer;
}

/**
 * @description Get injected metadata for extrinsic call
 *
 * @param api
 * @returns injected metadata
 */
export const getInjectorMetadata = (api: ApiPromise) => {
  return {
    chain: api.runtimeChain.toString(),
    specVersion: api.runtimeVersion.specVersion.toNumber(),
    tokenDecimals: api.registry.chainDecimals[0] || 18,
    tokenSymbol: api.registry.chainTokens[0] || "AVAIL",
    genesisHash: api.genesisHash.toHex(),
    ss58Format: isNumber(api.registry.chainSS58) ? api.registry.chainSS58 : 0,
    chainType: "substrate" as "substrate",
    icon: "substrate",
    types: types as any,
    userExtensions: signedExtensions,
  };
};

/**
 * @brief Send message to initiate a AVAIL-> ETH transaction
 *
 * @param props
 * @param account
 * @returns  { status: string, message: string, blockhash?: string }
 */
export async function sendMessage(
  props: sendMessageParams,
  account: WalletAccount,
  api: ApiPromise,
): Promise<{
  status: string;
  message: string;
  blockhash?: string;
  txHash?: string;
}> {
  const injector = getWalletBySource(account.source);

  const result: { blockhash: string; txHash: string } = await new Promise(
    (resolve, reject) => {
      const unsubscribe = api.tx.vector
        .sendMessage(props.message, props.to, props.domain)
        .signAndSend(
          account.address,
          {
            signer: injector?.signer,
            app_id: 0,
          } as Partial<LegacySignerOptions>,
          ({ status, events, txHash }) => {
            if (status.isInBlock) {
              Logger.info(
                `Transaction included at blockHash ${status.asInBlock} ${txHash}`,
              );

              events.forEach(({ event }) => {
                if (api.events.system.ExtrinsicFailed.is(event)) {
                  const [dispatchError] = event.data;
                  let errorInfo: string;
                  //@ts-ignore
                  if (dispatchError.isModule) {
                    const decoded = api.registry.findMetaError(
                      //@ts-ignore
                      dispatchError.asModule,
                    );
                    errorInfo = `${decoded.section}.${decoded.name}`;
                  } else {
                    errorInfo = dispatchError.toString();
                  }
                  reject(
                    new Error(
                      `Transaction failed. Status: ${status} with error: ${errorInfo}`,
                    ),
                  );
                }

                if (api.events.system.ExtrinsicSuccess.is(event)) {
                  Logger.info(
                    `Transaction successful with hash: ${status.asInBlock}`,
                  );
                  resolve({
                    blockhash: status.asInBlock.toString(),
                    txHash: txHash.toString(),
                  });
                }
              });
              //@ts-ignore
              unsubscribe();
            }
          },
        )
        .catch((error: any) => {
          reject(`ERROR_SEND_MESSAGE ${error}`);
          return {
            status: "failed",
            message: error,
          };
        });
    },
  );

  return {
    status: "success",
    message: "Transaction successful",
    blockhash: result.blockhash,
    txHash: result.txHash,
  };
}

/**
 *
 * @brief Execute transaction to finalize/claim a  ETH -> AVAIL transaction
 *
 * @param props
 * @param account
 * @returns  { status: string, message: string, blockhash?: string }
 */
export async function executeTransaction(
  props: executeParams,
  account: WalletAccount,
  api: ApiPromise,
): Promise<{
  status: string;
  message: string;
  blockhash?: string;
  txHash?: string;
}> {
  const injector = getWalletBySource(account.source);

  const result: { blockhash: string; txHash: string } = await new Promise(
    (resolve, reject) => {
      const unsubscribe = api.tx.vector
        .execute(
          props.slot,
          props.addrMessage,
          props.accountProof,
          props.storageProof,
        )
        .signAndSend(
          account.address,
          {
            signer: injector?.signer,
            app_id: 0,
          } as Partial<LegacySignerOptions>,
          ({ status, events, txHash }) => {
            if (status.isInBlock) {
              Logger.info(
                `Transaction included at blockHash ${status.asInBlock}`,
              );

              events.forEach(({ event }) => {
                if (api.events.system.ExtrinsicFailed.is(event)) {
                  const [dispatchError] = event.data;
                  let errorInfo: string;
                  //@ts-ignore
                  if (dispatchError.isModule) {
                    //@ts-ignore
                    const decoded = api.registry.findMetaError(
                      //@ts-ignore
                      dispatchError.asModule,
                    );
                    errorInfo = `${decoded.section}.${decoded.name}`;
                  } else {
                    errorInfo = dispatchError.toString();
                  }
                  Logger.info(`ExtrinsicFailed: ${errorInfo}`);
                  reject(
                    new Error(
                      `Transaction failed. Status: ${status} with error: ${errorInfo}`,
                    ),
                  );
                }

                if (api.events.system.ExtrinsicSuccess.is(event)) {
                  Logger.info(
                    `Transaction successful with hash: ${status.asInBlock}`,
                  );
                  resolve({
                    blockhash: status.asInBlock.toString(),
                    txHash: txHash.toString(),
                  });
                }
              });
              //@ts-ignore
              unsubscribe();
            }
          },
        )
        .catch((error: any) => {
          Logger.error(`Error in Execute: ${error}`);
          reject(error);
          return {
            status: "failed",
            message: error,
          };
        });
    },
  );

  return {
    status: "success",
    message: "Transaction successful",
    blockhash: result.blockhash,
    txHash: result.txHash,
  };
}

type TransactionStatus = {
  status: "success" | "failed";
  blockhash?: string;
  txHash?: string;
  txIndex?: number;
};

export async function transfer(
  atomicAmount: string,
  account: WalletAccount,
  api: ApiPromise,
): Promise<Result<TransactionStatus, Error>> {
  try {
    const injector = getWalletBySource(account.source);
    const options = {
      signer: injector?.signer,
      app_id: 0,
    } as Partial<LegacySignerOptions>;

    const txResult = await new Promise<ISubmittableResult>((resolve) => {
      api.tx.balances
        .transferKeepAlive(
          chainToAddresses(Chain.AVAIL).liquidityBridgeAddress,
          atomicAmount,
        )
        .signAndSend(account.address, options, (result: ISubmittableResult) => {
          console.log(`Tx status: ${result.status}`);
          if (result.isInBlock || result.isError) {
            resolve(result);
          }
        });
    });

    const error = txResult.dispatchError;
    if (txResult.isError) {
      return err(new Error(`Transaction failed with error: ${error}`));
    } else if (error != undefined) {
      if (error.isModule) {
        const decoded = api.registry.findMetaError(error.asModule);
        const { docs, name, section } = decoded;
        return err(new Error(`${section}.${name}: ${docs.join(" ")}`));
      } else {
        return err(new Error(error.toString()));
      }
    }

    return ok({
      status: "success",
      blockhash: txResult.status.asInBlock.toString(),
      txHash: txResult.txHash.toString(),
      txIndex: txResult.txIndex,
    });
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Unknown error occurred"),
    );
  }
}

async function sha256Hash(message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}

export async function signMessage(
  //message is base64 encoded payload
  message: string | `0x${string}`,
  account: WalletAccount,
): Promise<Result<string, Error>> {
  /*

  function flow - contains how ledger implements signing for substrate apps - do not remove.

  - we get the base64 encoded payload here
  - make a sha2_sha256 out of it - returns uint8array
  - we convert the uint8array to hex string -> comes 0x prefixed by u8aToHex
  - talisman’s `useLedgerSubstrateLegacy.ts` internally:
         - Converts the hex to bytes
         - trims 0x & wraps bytes with <Bytes> and </Bytes> markers using pkjs's u8aWrapBytes:
             - u8aWrapBytes -> used internally trims 0x (hexToU8a used internally)
             - u8aWrapBytes("<Bytes>" + message bytes + "</Bytes>") - it's a concat addition remember!
        - checks other ledger app related conditions
        - calls ledger.signRaw

  - ledger.signraw - calls signImpl ->
    - chunks to apdu packets and sends to ledger device
    - ledger detected the Bytes at the start - and knows NOT to use SCALE (encoding of how node decodes extrinsic data)
    - shows as is as hex with (0x) -> but with `bytes` prefix postfix concatenated on both sides
    - after user approval - signs with sr25519
    - returns sig


  */
  try {
    const messageBytes = await sha256Hash(message);
    const signer = account?.wallet?.signer;

    if (!signer) {
      throw new Error("Signer does not support signing raw messages");
    }

    const hexMessage = u8aToHex(messageBytes);
    const { signature } = await signer.signRaw({
      type: "payload",
      data: hexMessage,
      address: account.address,
    });

    const verification = signatureVerify(
      hexMessage,
      signature,
      account.address,
    );
    if (!verification.isValid) {
      throw new Error("Invalid signature generated");
    }

    return ok(signature as string);
  } catch (error) {
    console.error("Error during signing process:", error);
    return err(
      error instanceof Error ? error : new Error("Failed to sign the message"),
    );
  }
}
