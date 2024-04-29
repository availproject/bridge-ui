import {
  Chain,
  ethBalance,
  executeParams,
  sendMessageParams,
  TxnData,
} from "@/@types/types";
import { toast } from "@/components/ui/use-toast";
import {
  getKeyringFromSeed,
  initialize,
  isValidAddress,
} from "avail-js-sdk";
import { substrateConfig, ethConfig } from "@/config";
import { getBalance } from "@wagmi/core";
import { indexerInstance } from "./axios-instance";
import { WalletAccount } from "@talismn/connect-wallets";
import { SignerOptions } from "@polkadot/api/types";


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

export async function sendMessage(props: sendMessageParams, account: WalletAccount) {
  const api = await initialize(substrateConfig.endpoint);
  const keyring = getKeyringFromSeed(substrateConfig.seed);
  const result = await new Promise((resolve, reject) => {
    api.tx.vector
      .sendMessage(props.message, props.to, props.domain)
      .signAndSend(account.address,
        { signer: account.signer, app_id: 0 } as Partial<SignerOptions>, ({ status, events }) => {
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

export async function _getBalance(chain: Chain, availAddress?: string, ethAddress?: `0x${string}`) : Promise<number> {
  if (chain === Chain.AVAIL && availAddress) {
    const api = await initialize(substrateConfig.endpoint);
    const oldBalance: any = await api.query.system.account(availAddress)
    var intValue = parseInt(oldBalance["data"]["free"].toHuman().replace(/,/g, ''), 10)/ Math.pow(10, 18);
    return intValue;
  }
  if (chain === Chain.ETH && ethAddress) {
    const balance: ethBalance = await getBalance(ethConfig, {
      address: ethAddress,
    });
    return +(parseFloat(balance.formatted).toFixed(4));
  } else {
    return 0;
  }
}

export async function fetchLatestTxns(
  sourceChain: Chain,
  destinationChain: Chain,
  userAddress?: `0x${string}`,
): Promise<{ txnData: TxnData[] }> {
  const response = await indexerInstance
    .get(`/transactions`, {
      params: {
        sourceChain,
        destinationChain,
        userAddress,
      },
    })
    .catch((e) => {
      console.log(e);
      return { data: { result: [] } };
    });

  const result: TxnData[] = response.data.result;
  return { txnData: result };
}



fetchLatestTxns(Chain.ETH, Chain.AVAIL)
