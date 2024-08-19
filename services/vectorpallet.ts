import { toast } from "@/components/ui/use-toast";
import { isNumber } from "@polkadot/util";
import {
  ApiPromise,
  initialize,
  types,
  signedExtensions,
} from "avail-js-sdk";
import { substrateConfig } from "@/config/walletConfig";
import { getWalletBySource, WalletAccount } from "@talismn/connect-wallets";
import { SignerOptions } from "@polkadot/api/types";
import { executeParams, sendMessageParams } from "@/types/transaction";
import BigNumber from "bignumber.js";


/**
 * @description Get injected metadata for extrinsic call
 * 
 * @param api 
 * @returns injected metadata
 */
const getInjectorMetadata = (api: ApiPromise) => {
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
  account: WalletAccount
): Promise<{
  status: string;
  message: string;
  blockhash?: string;
  txHash?: string;
}> {
  const injector = await getWalletBySource(account.source);
  const api = await initialize(substrateConfig.endpoint);
  const metadata = getInjectorMetadata(api);

  //@ts-ignore
  await injector?.metadata?.provide(metadata);

  const result: {blockhash: string, txHash: string} = await new Promise((resolve, reject) => {
    const unsubscribe = api.tx.vector
      .sendMessage(props.message, props.to, props.domain)
      .signAndSend(
        account.address,
        { signer: injector?.signer, app_id: 0 } as Partial<SignerOptions>,
        ({ status, events, txHash }) => {
          if (status.isInBlock) {
            console.log()
            console.log(
              `Transaction included at blockHash ${status.asInBlock} ${txHash} `
            );

            events.forEach(({ event }) => {
              if (api.events.system.ExtrinsicFailed.is(event)) {
                const [dispatchError] = event.data;
                let errorInfo: string;
                //@ts-ignore
                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(
                               //@ts-ignore
                    dispatchError.asModule
                  );
                  errorInfo = `${decoded.section}.${decoded.name}`;
                } else {
                  errorInfo = dispatchError.toString();
                }

                toast({
                  title: `Transaction failed. Status: ${status} with error: ${errorInfo}`,
                });
                console.log(`ExtrinsicFailed: ${errorInfo}`);
                reject(
                  new Error(
                    `Transaction failed. Status: ${status} with error: ${errorInfo}`
                  )
                );
              }

              if (api.events.system.ExtrinsicSuccess.is(event)) {
                console.log(
                  "Transaction successful with hash:",
                  status.asInBlock
                );
                resolve({blockhash: status.asInBlock.toString(), txHash: txHash.toString()});
              }
            });
            //@ts-ignore
            unsubscribe();
          }
        }
      )
      .catch((error) => {
        console.error("Error in signAndSend:", error);
        reject(error);
        return {
          status: "failed",
          message: error,
        };
      });
  });

  return {
    status: "success",
    message: "Transaction successful",
    blockhash: result.blockhash,
    txHash: result.txHash
  };
}

export async function transferAvailForGas(
account: string,
sender: WalletAccount, 
): Promise<{
  status: string;
  message: string;
  blockhash?: string;
  txHash?: string;
}> {

  const injector = await getWalletBySource(sender.source);
  const api = await initialize(substrateConfig.endpoint);
  const metadata = getInjectorMetadata(api);

  //@ts-ignore
  await injector?.metadata?.provide(metadata);
  const amount = BigInt(.25 * (10 ** 18))
  console.log(amount)

  const result: {blockhash: string, txHash: string} = await new Promise((resolve, reject) => {
    const unsubscribe = api.tx.balances
      .transferKeepAlive(account, amount)
      .signAndSend(
        sender.address,
        { signer: injector?.signer, app_id: 0 } as Partial<SignerOptions>,
        ({ status, events, txHash }) => {
          if (status.isInBlock) {
            console.log(
              `Transaction included at blockHash ${status.asInBlock} ${txHash} `
            );

            events.forEach(({ event }) => {
              if (api.events.system.ExtrinsicFailed.is(event)) {
                const [dispatchError] = event.data;
                let errorInfo: string;
                //@ts-ignore
                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(
                               //@ts-ignore
                    dispatchError.asModule
                  );
                  errorInfo = `${decoded.section}.${decoded.name}`;
                } else {
                  errorInfo = dispatchError.toString();
                }

                toast({
                  title: `Transaction failed. Status: ${status} with error: ${errorInfo}`,
                });
                console.log(`ExtrinsicFailed: ${errorInfo}`);
                reject(
                  new Error(
                    `Transaction failed. Status: ${status} with error: ${errorInfo}`
                  )
                );
              }

              if (api.events.system.ExtrinsicSuccess.is(event)) {
                console.log(
                  "Transaction successful with hash:",
                  status.asInBlock
                );
                resolve({blockhash: status.asInBlock.toString(), txHash: txHash.toString()});
              }
            });
            //@ts-ignore
            unsubscribe();
          }
        }
      )
      .catch((error) => {
        console.error("Error in signAndSend:", error);
        reject(error);
        return {
          status: "failed",
          message: error,
        };
      });
  });

  return {
    status: "success",
    message: "Transaction successful",
    blockhash: result.blockhash,
    txHash: result.txHash
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
  account: WalletAccount
): Promise<{
  status: string;
  message: string;
  blockhash?: string;
  txHash?: string;
}> {
  const injector = await getWalletBySource(account.source);
  const api = await initialize(substrateConfig.endpoint);
  const metadata = getInjectorMetadata(api);
  
  //@ts-ignore
  await injector?.metadata?.provide(metadata);

  const result: {blockhash: string, txHash: string} = await new Promise((resolve, reject) => {
    const unsubscribe = api.tx.vector
      .execute(
        props.slot,
        props.addrMessage,
        props.accountProof,
        props.storageProof
      )
      .signAndSend(
        account.address,
        {
          signer: injector?.signer,
          app_id: 0,
          nonce: -1,
        } as Partial<SignerOptions>,
        ({ status, events, txHash }) => {
          if (status.isInBlock) {
            console.log(
              `Transaction included at blockHash ${status.asInBlock}`
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
                    dispatchError.asModule
                  );
                  errorInfo = `${decoded.section}.${decoded.name}`;
                } else {
                  errorInfo = dispatchError.toString();
                }

                toast({
                  title: `Transaction failed. Status: ${status} with error: ${errorInfo}`,
                });
                console.log(`ExtrinsicFailed: ${errorInfo}`);
                reject(
                  new Error(
                    `Transaction failed. Status: ${status} with error: ${errorInfo}`
                  )
                );
              }

              if (api.events.system.ExtrinsicSuccess.is(event)) {
                console.log(
                  "Transaction successful with hash:",
                  status.asInBlock
                );
                resolve({blockhash: status.asInBlock.toString(), txHash: txHash.toString()});
              }
            });
            //@ts-ignore
            unsubscribe();
          }
        }
      )
      .catch((error: any) => {
        console.error("Error in Execute:", error);
        reject(error);
        return {
          status: "failed",
          message: error,
        };
      });
  });

  return {
    status: "success",
    message: "Transaction successful",
    blockhash: result.blockhash,
    txHash: result.txHash
  };
}

