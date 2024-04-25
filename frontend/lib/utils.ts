import { Chain, executeParams, sendMessageParams } from "@/@types/types";
import { toast } from "@/components/ui/use-toast";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ApiPromise,
  disconnect,
  formatNumberToBalance,
  getDecimals,
  getKeyringFromSeed,
  initialize,
  isValidAddress,
  WsProvider,
  types,
  signedExtensions,
  rpc,
} from "avail-js-sdk";

import { resolve } from "path";
import { substrateConfig, ethConfig } from "@/config";
import { getBalance } from "@wagmi/core";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export async function getSignature(account: any) {
  try {
    const signer = account.wallet.signer;
    const timestamp = Date.now();
    const { signature } = await signer.signRaw({
      type: "payload",
      data: `Greetings from Avail!\n\nSign this message to check your eligibility. This signature will not cost you any fees.\n\nTimestamp: ${timestamp}`,
      address: account.address,
    });
    return {
      signature,
      timestamp,
    };
  } catch (err: any) {
    toast({
      title: `${err}`,
    });
  }
}
export async function sendMessage(props: sendMessageParams) {
  const api = await initialize(substrateConfig.endpoint);
  const keyring = getKeyringFromSeed(substrateConfig.seed);
  const result = await new Promise((resolve, reject) => {
    api.tx.vector
      .sendMessage(props.message, props.to, props.domain)
      .signAndSend(keyring, ({ status, events }) => {
        if (status.isInBlock) {
          console.log(`Transaction included at blockHash ${status.asInBlock}`);
          events.forEach(({ event }) => {
            if (api.events.system.ExtrinsicFailed.is(event)) {
              const [dispatchError] = event.data;
              let errorInfo;
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
              reject(
                `Transaction failed. Status: ${status} with error: ${errorInfo}`
              );
              console.log(`$:: ExtrinsicFailed:: ${errorInfo}`);
            }
            if (api.events.system.ExtrinsicSuccess.is(event)) {
              console.log(
                "Transaction successful with hash: ",
                event.data.toString()
              );
              toast({
                title: `Transaction Success. Status: ${status}`,
              });
            }
          });
          //TODO: add an error 
          resolve(`Transaction successful with hash: ${status.asInBlock}`);
        } else if (status.isFinalized) {
          reject(`Transaction failed. Status: ${status}`);
        }
      });
  });
  return result;
}

export async function executeTransaction(props: executeParams) {
  const api = await initialize(substrateConfig.endpoint);
  const keyring = getKeyringFromSeed(substrateConfig.seed);
  const result = await new Promise((resolve, reject) => {
    api.tx.vector
      .execute(props.slot, props.addrMessage, props.accountProof, props.storageProof)
      .signAndSend(keyring, ({ status, events }) => {
        if (status.isInBlock) {
          console.log(`Transaction included at blockHash ${status.asInBlock}`);
          events.forEach(({ event }) => {
            if (api.events.system.ExtrinsicFailed.is(event)) {
              const [dispatchError] = event.data;
              let errorInfo;
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
              reject(
                `Transaction failed. Status: ${status} with error: ${errorInfo}`
              );
              console.log(`$:: ExtrinsicFailed:: ${errorInfo}`);
            }
            if (api.events.system.ExtrinsicSuccess.is(event)) {
              console.log(
                "Transaction successful with hash: ",
                event.data.toString()
              );
              toast({
                title: `Transaction Success. Status: ${status}`,
              });
            }
          });
          resolve(`Transaction successful with hash: ${status.asInBlock}`);
        } else if (status.isFinalized) {
          reject(`Transaction failed. Status: ${status}`);
        }
      });
  });
  return result;
}

export async function _getBalance(address: `0x${string}`, chain: Chain) {
  if (chain === Chain.AVAIL) {
    const keyring = getKeyringFromSeed(substrateConfig.seed);
    const options = { app_id: 0, nonce: -1 };
    // const decimals = getDecimals(api);
    // const result = await api.tx.
    // let data = await api.query.system.account(address);
    // console.log(data, "as")
    // const _amount = formatNumberToBalance(amount, decimals);
    return 0;
  }
  if (chain === Chain.ETH) {
    const balance = getBalance(ethConfig, {
      address: address,
    })
    return 0;
  } else {
    return 0;
  }
}

