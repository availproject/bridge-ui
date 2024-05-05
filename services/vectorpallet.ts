

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
import { WalletAccount } from "@talismn/connect-wallets";
import { SignerOptions } from "@polkadot/api/types";
import { executeParams, sendMessageParams } from "@/types/transaction";


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
  const { web3Accounts, web3FromSource } = await import(
    "@polkadot/extension-dapp"
  );
  console.log(account.source);
  const injector = await web3FromSource(account.source);
  const api = await initialize(substrateConfig.endpoint);
  const metadata = getInjectorMetadata(api);
  await injector?.metadata?.provide(metadata);

try{
  const result : `${string}` = await new Promise((resolve, reject) => {
    api.tx.vector
      .sendMessage(props.message, props.to, props.domain)
      .signAndSend(account.address,
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
  const { web3Accounts, web3FromSource } = await import(
    "@polkadot/extension-dapp"
  );
  const injector = await web3FromSource(account.source);
  const api = await initialize(substrateConfig.endpoint);
  const metadata = getInjectorMetadata(api);
  await injector?.metadata?.provide(metadata);

  try {
    const result : `${string}` = await new Promise((resolve, reject) => {
      api.tx.vector
        .execute(
          props.slot,
          props.addrMessage,
          props.accountProof,
          props.storageProof
        )
        .signAndSend(account.address,
          { signer: injector.signer, app_id: 0 } as Partial<SignerOptions>, 
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
     return {
       status: "failed",
       message: "Transaction failed",
     }
   }
}



export const hello = async () => {
  const api = await initialize("wss://turing-rpc.avail.so/ws")
  const message = {
    FungibleToken: {
      assetId: "0x0000000000000000000000000000000000000000000000000000000000000000",
      amount: BigInt(4000000000000000000),
    },
  }
  const to = "0x3942f3a6d7637d9f151b81063a9c5003b278231b000000000000000000000000"
  const domain = 2

  const tx = api.tx.vector.sendMessage(message, to, domain)
  console.log(tx.toHuman())
  console.log(tx.toHex())
  await disconnect()
  return tx.toHex()
}
