

import { toast } from "@/components/ui/use-toast";
import { isNumber } from "@polkadot/util";
import {
  ApiPromise,
  initialize,
  types,
  signedExtensions,
  disconnect
} from "avail-js-sdk";
import { substrateConfig } from "@/config/walletConfig";
import { getWalletBySource, WalletAccount } from "@talismn/connect-wallets";
import { SignerOptions } from "@polkadot/api/types";
import { executeParams, sendMessageParams } from "@/types/transaction";
import { web3FromSource } from '@talisman-connect/components';


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

export async function sendMessage(props: sendMessageParams, account: WalletAccount) : Promise <{
  status: string;
  message: string;
  blockhash?: `${string}`
}> {
  const injector = await getWalletBySource(account.source);
  console.log(injector, "injector")
  const api = await initialize(substrateConfig.endpoint);
  const metadata = getInjectorMetadata(api);
  //@ts-ignore
  await injector?.metadata?.provide(metadata);

try{
  const result : `${string}` = await new Promise((resolve, reject) => {
    api.tx.vector
      .sendMessage(props.message, props.to, props.domain)
      .signAndSend(account.address,
          //@ts-ignore
        { signer: injector.signer, app_id: 0 } as Partial<SignerOptions>, ({ status, events }) => {
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
                console.log(`$:: ExtrinsicFailed:: ${errorInfo}`);
              throw new Error(`Transaction failed. Status: ${status} with error: ${errorInfo}`); 
              }
              if (api.events.system.ExtrinsicSuccess.is(event)) {
                console.log(
                  "Transaction successful with hash:  ",
                );
                console.log("successful extrisic hash",  status.asInBlock
              )
                //@FIX: can't do 0xstring since this returns a string for some reason
                resolve(`${status.asInBlock}`);
              }
            });
          }
        });
  });
  return {
    status: "success",
    message: "Transaction successful",
    blockhash: result
  };
} catch (e) {
  return {
    status: "failed",
    message: "Transaction failed",
  }
}
  
}

export async function executeTransaction(props: executeParams, account: WalletAccount) :  Promise <{
  status: string;
  message: string;
  blockhash?: `${string}`
}>  {

  const injector = await getWalletBySource(account.source);
  console.log(injector, "injector")
  const api = await initialize(substrateConfig.endpoint);
  const metadata = getInjectorMetadata(api);
    //@ts-ignore
  await injector?.metadata?.provide(metadata);

  try {
    const result : `${string}` = await new Promise((resolve, reject) => {
      api.tx['vector']['execute'](
          props.slot,
          props.addrMessage,
          props.accountProof,
          props.storageProof
        )
        .signAndSend(account.address,
            //@ts-ignore
          { signer: injector.signer, app_id: 0,  nonce: -1  } as Partial<SignerOptions>, 
          ({ status, events }) => {
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
                   console.log(`$:: ExtrinsicFailed:: ${errorInfo}`);
                 throw new Error(`Transaction failed. Status: ${status} with error: ${errorInfo}`); 
                 }
                 if (api.events.system.ExtrinsicSuccess.is(event)) {
                   console.log(
                     "Transaction successful with hash: ",
                     event
                   );
                   console.log("successful txn")
                   //@FIX: can't do 0xstring since this returns a string for some reason
                   resolve(`${status.asInBlock}`);
                 }
               });
             }
           });     
     });
     return {
       status: "success",
       message: "Transaction successful",
       blockhash: result
     };
   } catch (e) {
    console.log(e, "error in executeTransaction");
     return {
       status: "failed",
       message: "Transaction failed",
     }
   }
}


//  await disconnect()