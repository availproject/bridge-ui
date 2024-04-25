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
import config from "@/config";
import { resolve } from "path";
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
  const api = await initialize(config.endpoint);
  const keyring = getKeyringFromSeed(config.seed);
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
          resolve(`Transaction successful with hash: ${status.asInBlock}`);
        } else if (status.isFinalized) {
          reject(`Transaction failed. Status: ${status}`);
        }
      });
  });
  return result;
}

export async function executeTransaction(props: executeParams) {
  const api = await initialize(config.endpoint);
  const keyring = getKeyringFromSeed(config.seed);
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

export async function _getBalance(address: string, chain: Chain) {
  if (chain === Chain.AVAIL) {
    const keyring = getKeyringFromSeed(config.seed);
    const options = { app_id: 0, nonce: -1 };
    // const decimals = getDecimals(api);
    // const result = await api.tx.
    // let data = await api.query.system.account(address);
    // console.log(data, "as")
    // const _amount = formatNumberToBalance(amount, decimals);
    return 0;
  }
  if (chain === Chain.ETH) {
    // const balance = getBalance(config, {
    //   address: address,
    // })
    return 0;
  } else {
    return "wrong chain";
  }
}
