
 
import { toast } from "@/components/ui/use-toast";
import { isNumber } from "@polkadot/util";
import {
  ApiPromise,
  getKeyringFromSeed,
  initialize,
  isValidAddress,
  rpc, types, TURING_ENDPOINT,signedExtensions, 
  disconnect
} from "avail-js-sdk";
import { substrateConfig, ethConfig } from "@/config/walletConfig";
import { getBalance } from "@wagmi/core";
import { WalletAccount } from "@talismn/connect-wallets";
import { SignerOptions } from "@polkadot/api/types";
import { encodeAbiParameters } from 'viem'
import { web3Enable } from "@polkadot/extension-dapp";
import { executeParams, sendMessageParams, TxnData } from "@/types/transaction";
import { Chain, ethBalance } from "@/types/common";
// import { useCommonStore } from "@/stores/common";

// const {api , setApi} = useCommonStore()

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

  // export async function initializeApi() {
  //   const api = await initialize(substrateConfig.endpoint);
  //   setApi(api)
  // }
  
export async function sendMessage(props: sendMessageParams, account: WalletAccount) {
    const { web3Accounts, web3FromSource } = await import(
      "@polkadot/extension-dapp"
    );
    const injector = await web3FromSource(account.source);
    console.log(account.source, injector, "sdf");
    const api = await initialize(substrateConfig.endpoint);
    const metadata = getInjectorMetadata(api);
    await injector?.metadata?.provide(metadata);

    console.log(props.message, props.to, props.domain, "sdf")
    console.log(injector.signer, "sdf");
    const result = await new Promise((resolve, reject) => {
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
                    title:`Transaction failed. Status: ${status} with error: ${errorInfo}`,
                  });
                  reject(
                    `Transaction failed. Status: ${status} with error: ${errorInfo}`
                  );
                  console.log(`$:: ExtrinsicFailed:: ${errorInfo}`);
                }
                if (api.events.system.ExtrinsicSuccess.is(event)) {
                  if (status.isFinalized) {
                    console.log(
                      "Transaction successful with hash: ",
                      event.data.toString()
                    );
                    toast({
                      title: `Transaction Success. Status: ${status}`,
                    });
                    resolve(`Transaction successful with hash: ${status.asInBlock}`);
                  } else {
                    //fix with @Leouarz if finality takes more than 4 minutes
                    setTimeout(() => {
                      if (status.isFinalized) {
                        console.log(
                          "Transaction successful with hash: ",
                          event.data.toString()
                        );
                        toast({
                          title: `Transaction Success. Status: ${status}`,
                        });
                        resolve(`Transaction successful with hash: ${status.asInBlock}`);
                      } else {
                        toast({
                          title: `Block not finalised after 2 minutes`,
                        });
                        reject(`Block not finalised after 2 minutes`);
                      }
                    }, 2 * 60 * 1000);
                  }
                }
              });
            } else {
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
        .execute(
          props.slot,
          props.addrMessage,
          props.accountProof,
          props.storageProof
        )
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
