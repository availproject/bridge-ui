/**
 * TODO: params include from chain, to chain, amount, destination address
 */

import { ONE_POWER_EIGHTEEN } from "@/constants/bigNumber";
import { sendPayload } from "@/services/bridgeapi";
import { getTokenBalance } from "@/services/contract";
import { signMessage, transfer } from "@/services/pallet";
import { useApi } from "@/stores/api";
import { useAvailAccount } from "@/stores/availwallet";
import { Chain } from "@/types/common";
import { substrateAddressToPublicKey } from "@/utils/common";
import BigNumber from "bignumber.js";
import useEthWallet from "./common/useEthWallet";
import { chainToAddresses } from "@/components/common/utils";
import {
  verifyMessage,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { config } from "@/config/walletConfig";
import availTokenAbi from "@/constants/abis/availTokenAbi.json";
import { signMessage as personalSign } from "@wagmi/core";
import { formatUnits, hashMessage, recoverPublicKey } from "viem";
import { publicKeyToAddress } from "viem/accounts";
import { useCommonStore } from "@/stores/common";
import { Logger } from "@/utils/logger";
import { Transaction } from "@/types/transaction";

const isSignatureRejection = (error: any): boolean => {
  const errorMessage = error?.message || error?.toString() || "";
  return (
    errorMessage.match(/denied transaction/i) ||
    errorMessage.match(/User rejected the transaction/i) ||
    errorMessage.match(/User rejected the request/i) ||
    errorMessage.match(/user rejected transaction/i) ||
    errorMessage.match(/Rejected by user/i) ||
    errorMessage.match(/user denied/i) ||
    errorMessage.match(/cancelled/i) ||
    errorMessage.match(/user rejected signature/i) ||
    errorMessage.includes("ACTION_REJECTED")
  );
};

export default function useLiquidityBridge() {
  const { selected } = useAvailAccount();
  const { api, ensureConnection } = useApi();
  const { activeUserAddress, validateandSwitchChain, getERC20AvailBalance } =
    useEthWallet();
  const { setSignatures, warningDialog } = useCommonStore();

  interface ILiquidityBridgeParams {
    ERC20Chain: Chain;
    atomicAmount: string;
    destinationAddress: string;
  }

  /** HELPER FUNCTIONS */
  async function transferERC20AvailToLiquidityBridge(
    amount: string,
    ERC20Chain: Chain,
  ) {
    try {
      const hash = await writeContract(config, {
        address: chainToAddresses(ERC20Chain).tokenAddress as `0x${string}`,
        abi: availTokenAbi,
        functionName: "transfer",
        args: [chainToAddresses(ERC20Chain).liquidityBridgeAddress, amount],
      });
      const transactionReceipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
      });

      return {
        txnHash: hash,
        blockhash: transactionReceipt.blockHash,
      };
    } catch (error) {
      console.error("Transfer To Liquidity Bridge Failed:", error);
      throw error;
    } finally {
      setSignatures("- 1 of 1");
    }
  }
  const toHex = (num: string | number | bigint | boolean) =>
    "0x" + BigInt(num).toString(16).toUpperCase();

  const encodePayload = (payload: Record<string, any>): string => {
    const jsonString = JSON.stringify(payload);
    let encoded = Buffer.from(jsonString).toString("base64");
    return encoded;
  };

  /** BRIDGING FLOWS */
  const initERC20toAvailAutomaticBridging = async ({
    ERC20Chain,
    atomicAmount,
    destinationAddress,
  }: ILiquidityBridgeParams) => {
    /**
     * 1. initial checks
     * 2. balance transfer to pool account
     * 3. use blockhash, tx_index and other fields to form a payload and encode it
     * 4. generate signature (X-Payload-Signature to the ECDSA signature) and verify it
     * 5. generate public key from signature and verify it
     * 5. send payload at /v1/eth_to_avail
     */

    try {
      setSignatures("- 1 of 2");
      if (!activeUserAddress) throw new Error("No account selected");
      await validateandSwitchChain(ERC20Chain);

      const availBalance = await getERC20AvailBalance(ERC20Chain);
      if (new BigNumber(atomicAmount).gte(new BigNumber(availBalance))) {
        throw new Error("insufficient balance");
      }

      /**IMPORTANT: FOR BASE WHY IS THERE NO BLOCKHASH THAT SHOWS IN THEIR EXPLORER? */
      const hash = await transferERC20AvailToLiquidityBridge(
        atomicAmount,
        ERC20Chain,
      );
      if (!hash) throw new Error("Failed to transfer to liquidity bridge");
      setSignatures("- 2 of 2");

      Logger.info(
        `LIQUIDITY_BRIDGE TRANSFER_SUCESS`,
        ["receiver_address", destinationAddress],
        ["sender_address", activeUserAddress],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", ` ${ERC20Chain} -> AVAIL`],
        [
          "fields",
          {
            source_tx_hash: hash.txnHash,
            source_chain_id: ERC20Chain,
          },
        ],
        ["blockHash", hash.blockhash],
      );

      const payload = {
        sender_address: activeUserAddress,
        tx_hash: hash.txnHash,
        avl_receiver_address: destinationAddress,
        amount: toHex(atomicAmount),
      };
      const encodedPayload = encodePayload(payload);

      console.log("Payload: ", payload, encodedPayload);

      let sig: `0x${string}`;

      try {
        sig = await personalSign(config, {
          message: encodedPayload,
        });
        if (!sig) {
          throw new Error("Failed to sign payload");
        }
      } catch (signError: any) {
        if (isSignatureRejection(signError)) {
          sig = await new Promise<`0x${string}`>((resolve, reject) => {
            warningDialog.setCallbacks(
              () => {
                reject(
                  new Error(
                    "Funds will be manually refunded on source chain 7 days later, reach out on discord, you rejected the signature",
                  ),
                );
              },
              async () => {
                try {
                  const retrySig = await personalSign(config, {
                    message: encodedPayload,
                  });
                  if (!retrySig) {
                    throw new Error("Failed to sign payload on retry");
                  }
                  resolve(retrySig);
                } catch (retryError: any) {
                  if (isSignatureRejection(retryError)) {
                    reject(
                      new Error(
                        "Funds will be manually refunded on source chain 7 days later, reach out on discord, you rejected the signature",
                      ),
                    );
                  } else {
                    reject(retryError);
                  }
                }
              },
            );
            warningDialog.setWarning(
              "Signature required to complete transaction",
            );
            warningDialog.onOpenChange(true);
          });
        } else {
          throw signError;
        }
      }

      console.log("Signature: ", sig);

      const isValid = await verifyMessage(config, {
        address: activeUserAddress,
        message: encodedPayload,
        signature: sig,
      });
      if (!isValid) {
        throw new Error("Invalid Signature");
      }

      console.log("Signature: ", isValid, sig);

      const publicKey = await recoverPublicKey({
        hash: hashMessage(encodedPayload),
        signature: sig,
      });
      const address = publicKeyToAddress(publicKey);
      if (!publicKey) {
        throw new Error("Failed to recover public key");
      }

      console.log("Public Key: ", publicKey);
      console.log("Address of pub key: ", address);

      const response = await sendPayload(
        encodePayload(payload),
        sig,
        "eth_to_avail",
        publicKey,
      );
      if (response.isErr()) {
        throw new Error(` ${response.error}`);
      }

      Logger.info(
        `LIQUIDITY_BRIDGE INIT_SUCCESS ${hash.txnHash} receiver_address: ${destinationAddress} sender_address: ${activeUserAddress} amount: ${atomicAmount} flow: ${ERC20Chain} -> AVAIL`,
      );

      return {
        chain: ERC20Chain,
        hash: hash.txnHash,
        id: response.value.id,
      };
    } catch (error: any) {
      Logger.error(
        `LIQUIDITY_BRIDGE INIT_FAILED: ${error.message}`,
        ["receiver_address", destinationAddress],
        ["sender_address", activeUserAddress],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", `${ERC20Chain} -> AVAIL`],
      );
      throw new Error(
        `${error.message} : Failed to bridge from ${ERC20Chain} to Avail`,
      );
    } finally {
      setSignatures("");
    }
  };

  const initAvailToERC20AutomaticBridging = async ({
    ERC20Chain,
    atomicAmount,
    destinationAddress,
  }: ILiquidityBridgeParams) => {
    /**
     * 0. initial checks
     * 1. balance transfer to pool account
     * 2. use blockhash, tx_index and other fields to form a payload
     * 3. generate signature (X-Payload-Signature to the Sr25519 signature)
     * 3. send payload at /v1/avail_to_eth with retries
     *
     */
    try {
      if (selected === undefined || selected === null) {
        throw new Error("No account selected");
      }
      setSignatures("- 1 of 2");
      if (!api || !api.isConnected || !api.isReady) await ensureConnection();
      if (!api?.isReady)
        throw new Error("Uh oh! Failed to connect to Avail Api");

      const availBalance = await getTokenBalance(
        Chain.AVAIL,
        selected.address,
        api,
      );
      if (!availBalance) {
        throw new Error("Failed to fetch balance");
      }

      if (
        availBalance &&
        new BigNumber(atomicAmount).gt(
          new BigNumber(availBalance).times(ONE_POWER_EIGHTEEN),
        )
      ) {
        throw new Error("insufficient avail balance");
      }
      const result = await transfer(atomicAmount, selected, api);
      if (result.isErr()) {
        throw new Error(`AVAIL_TRANSFER_FAILED ${result.error}`);
      }
      setSignatures("- 2 of 2");

      if (!result.value.txIndex || !result.value.blockhash) {
        throw new Error("Failed to get blockhash and tx_index");
      }

      Logger.info(
        `LIQUIDITY_BRIDGE TRANSFER_SUCESS`,
        ["receiver_address", destinationAddress],
        ["sender_address", selected?.address],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", `AVAIL -> ${ERC20Chain}`],
        [
          "fields",
          {
            source_tx_hash: result.value.txHash,
            destination_chain_id: ERC20Chain,
          },
        ],
        ["blockHash", result.value.blockhash],
        ["txnIndex", result.value.txIndex],
      );

      const payload = {
        sender_address: substrateAddressToPublicKey(selected.address),
        tx_index: result.value.txIndex,
        block_hash: result.value.blockhash,
        eth_receiver_address: destinationAddress,
        amount: toHex(atomicAmount),
      };

      let sig;

      const sigResult = await signMessage(encodePayload(payload), selected);

      if (sigResult.isOk()) {
        sig = sigResult.value;
      }
      if (sigResult.isErr()) {
        if (isSignatureRejection(sigResult.error)) {
          const retrySigResult = await new Promise<any>((resolve, reject) => {
            warningDialog.setCallbacks(
              () => {
                reject(
                  new Error(
                    "Funds will be manually refunded on source chain 7 days later, reach out on discord, you rejected the signature",
                  ),
                );
              },
              async () => {
                try {
                  const retrySig = await signMessage(
                    encodePayload(payload),
                    selected,
                  );
                  if (retrySig.isErr()) {
                    if (isSignatureRejection(retrySig.error)) {
                      reject(
                        new Error(
                          "Funds will be manually refunded on source chain 7 days later, reach out on discord, you rejected the signature",
                        ),
                      );
                    } else {
                      reject(
                        new Error(
                          `${retrySig.error} : Failed to sign payload on retry`,
                        ),
                      );
                    }
                    return;
                  }
                  resolve(retrySig);
                } catch (retryError: any) {
                  reject(retryError);
                }
              },
            );
            warningDialog.setWarning(
              "Signature required to complete transaction",
            );
            warningDialog.onOpenChange(true);
          });

          sig = retrySigResult.value;
        } else {
          throw new Error(`${sigResult.error} : Failed to sign payload`);
        }
      }

      //NOTE: to be passed as base64 encoded string
      const response = await sendPayload(
        encodePayload(payload),
        sig,
        "avail_to_eth",
      );
      if (response.isErr()) {
        throw new Error(` ${response.error} : Failed to send payload`);
      }
      Logger.info(
        `LIQUIDITY_BRIDGE INIT_SUCCESS ${result.value.txHash} receiver_address: ${destinationAddress} sender_address: ${selected?.address} amount: ${atomicAmount} flow: AVAIL -> ${ERC20Chain}`,
      );

      return {
        chain: Chain.AVAIL,
        hash: result.value.txHash,
        id: response.value.id,
      };
    } catch (error: any) {
      Logger.error(
        `LIQUIDITY_BRIDGE INIT_FAILED: ${error.message}`,
        ["receiver_address", destinationAddress],
        ["sender_address", selected?.address],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", `AVAIL -> ${ERC20Chain}`],
      );

      throw new Error(
        `${error.message} Failed to bridge from Avail to ${ERC20Chain}`,
      );
    } finally {
      setSignatures("");
    }
  };

  interface RetryParams {
    signOn: Chain;
    response: Transaction;
  }

  async function retryLiquidityBridgeTxn({ signOn, response }: RetryParams) {
    /*
    1. check what direction the txn is - get from params
    2. remake the payload from txn response (check payload above)
    3. encode + popup signature based on signOn chain
    4. send payload again based on signOn chain
    5. give back response is success or error
    */
    try {
      Logger.info("LIQUIDITY_BRIDGE RETRY_INITIATED");

      if (!response.sourceTransactionHash) {
        throw new Error("Source transaction hash is required for retry");
      }
      if (!response.amount) {
        throw new Error("Transaction amount is required for retry");
      }

      const isAvailToEth = response.sourceChain === Chain.AVAIL;
      const isEthToAvail =
        response.sourceChain === Chain.ETH ||
        response.sourceChain === Chain.BASE;

      let payload;
      let direction: string;

      /* VALIDATIONS */
      if (isAvailToEth) {
        if (!selected?.address) {
          throw new Error("Please connect Avail wallet");
        }
        if (!response.sourceTransactionIndex || !response.sourceBlockHash) {
          throw new Error(
            "Transaction index and block hash are required for Avail to ETH retry",
          );
        }
        payload = {
          sender_address: substrateAddressToPublicKey(selected.address),
          tx_index: response.sourceTransactionIndex,
          block_hash: response.sourceBlockHash,
          eth_receiver_address: activeUserAddress || response.receiverAddress,
          amount: toHex(response.amount),
        };
        direction = "avail_to_eth";
      } else if (isEthToAvail) {
        if (!activeUserAddress) {
          throw new Error("Please connect EVM wallet");
        }
        payload = {
          sender_address: activeUserAddress,
          tx_hash: response.sourceTransactionHash,
          avl_receiver_address: selected?.address || response.receiverAddress,
          amount: toHex(response.amount),
        };
        direction = "eth_to_avail";
      } else {
        throw new Error("Unknown transaction direction");
      }

      /* PAYLOAD CREATION */
      const encodedPayload = encodePayload(payload);
      if (signOn === Chain.AVAIL) {
        if (!selected?.address) {
          throw new Error("Please connect Avail wallet");
        }
      } else {
        if (!activeUserAddress) {
          throw new Error("Please connect EVM wallet");
        }
      }

      /* SIGNATURE POPUP */
      let sig: string | `0x${string}`;
      if (signOn === Chain.AVAIL) {
        const sigResult = await signMessage(encodedPayload, selected!);
        if (sigResult.isErr()) {
          if (isSignatureRejection(sigResult.error)) {
            const retrySigResult = await new Promise<any>((resolve, reject) => {
              warningDialog.setCallbacks(
                () => {
                  reject(
                    new Error(
                      "Signature required to retry transaction. Transaction retry cancelled.",
                    ),
                  );
                },
                async () => {
                  try {
                    const retrySig = await signMessage(
                      encodedPayload,
                      selected!,
                    );
                    if (retrySig.isErr()) {
                      if (isSignatureRejection(retrySig.error)) {
                        reject(
                          new Error(
                            "Signature required to retry transaction. Transaction retry cancelled.",
                          ),
                        );
                      } else {
                        reject(
                          new Error(
                            `${retrySig.error} : Failed to sign payload on retry`,
                          ),
                        );
                      }
                      return;
                    }
                    resolve(retrySig);
                  } catch (retryError: any) {
                    reject(retryError);
                  }
                },
              );
              warningDialog.setWarning(
                "Signature required to retry transaction",
              );
              warningDialog.onOpenChange(true);
            });

            sig = retrySigResult.value;
          } else {
            throw new Error(`${sigResult.error} : Failed to sign payload`);
          }
        } else {
          sig = sigResult.value;
        }
      } else {
        // Use EVM signing

        try {
          sig = await personalSign(config, {
            message: encodedPayload,
          });
          if (!sig) {
            throw new Error("Failed to sign payload");
          }
        } catch (signError: any) {
          if (isSignatureRejection(signError)) {
            sig = await new Promise<`0x${string}`>((resolve, reject) => {
              warningDialog.setCallbacks(
                () => {
                  reject(
                    new Error(
                      "Signature required to retry transaction. Transaction retry cancelled.",
                    ),
                  );
                },
                async () => {
                  try {
                    const retrySig = await personalSign(config, {
                      message: encodedPayload,
                    });
                    if (!retrySig) {
                      throw new Error("Failed to sign payload on retry");
                    }
                    resolve(retrySig);
                  } catch (retryError: any) {
                    if (isSignatureRejection(retryError)) {
                      reject(
                        new Error(
                          "Signature required to retry transaction. Transaction retry cancelled.",
                        ),
                      );
                    } else {
                      reject(retryError);
                    }
                  }
                },
              );
              warningDialog.setWarning(
                "Signature required to retry transaction",
              );
              warningDialog.onOpenChange(true);
            });
          } else {
            throw signError;
          }
        }

        // Verify signature for EVM
        const isValid = await verifyMessage(config, {
          address: activeUserAddress!,
          message: encodedPayload,
          signature: sig as `0x${string}`,
        });
        if (!isValid) {
          throw new Error("Invalid Signature");
        }
      }

      /* SEND PAYLOAD */
      let apiResponse;
      if (signOn === Chain.AVAIL) {
        apiResponse = await sendPayload(encodedPayload, sig, direction);
      } else {
        const publicKey = await recoverPublicKey({
          hash: hashMessage(encodedPayload),
          signature: sig as `0x${string}`,
        });
        apiResponse = await sendPayload(
          encodedPayload,
          sig as string,
          direction,
          publicKey,
        );
      }
      if (apiResponse.isErr()) {
        throw new Error(`${apiResponse.error}`);
      }

      Logger.info(
        `LIQUIDITY_BRIDGE RETRY_SUCCESS hash: ${response.sourceTransactionHash} id: ${apiResponse.value.id}`,
      );

      return {
        chain: response.sourceChain,
        hash: response.sourceTransactionHash,
        id: apiResponse.value.id,
      };
    } catch (error: any) {
      Logger.error(`LIQUIDITY_BRIDGE RETRY_FAILED: ${error.message}`);

      throw new Error(
        `${error.message} : Failed to retry liquidity bridge transaction`,
      );
    } finally {
      setSignatures("");
    }
  }

  return {
    initAvailToERC20AutomaticBridging,
    initERC20toAvailAutomaticBridging,
    retryLiquidityBridgeTxn,
  };
}
