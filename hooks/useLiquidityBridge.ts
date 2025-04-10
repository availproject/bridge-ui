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
import { verifyMessage, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { config } from "@/config/walletConfig";
import availTokenAbi from "@/constants/abis/availTokenAbi.json";
import { signMessage as personalSign } from '@wagmi/core'
import { formatUnits, hashMessage, recoverPublicKey } from "viem";
import { publicKeyToAddress } from "viem/accounts";
import { useCommonStore } from "@/stores/common";
import { Logger } from "@/utils/logger";
 
export default function useLiquidityBridge() {
  const { selected } = useAvailAccount();
  const { api, ensureConnection } = useApi();
  const { activeUserAddress, validateandSwitchChain, getERC20AvailBalance } = useEthWallet();
  const { setSignatures } = useCommonStore()

  interface ILiquidityBridgeParams {
    ERC20Chain: Chain;
    atomicAmount: string;
    destinationAddress: string;
  }

  /** HELPER FUNCTIONS */
  async function transferERC20AvailToLiquidityBridge(amount: string, ERC20Chain: Chain) {
    try {
      const hash = await writeContract(config, {
        address: chainToAddresses(ERC20Chain).tokenAddress as `0x${string}`,
        abi: availTokenAbi,
        functionName: 'transfer',
        args: [chainToAddresses(ERC20Chain).liquidityBridgeAddress, amount]
      })
      const transactionReceipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
      })

      return {
        txnHash: hash,
        blockhash: (transactionReceipt).blockHash,
      }
    } catch (error) {
      console.error('Transfer To Liquidity Bridge Failed:', error)
      throw error 
    } finally {
      setSignatures("- 1 of 1")
    }
  }
  const toHex = (num: string | number | bigint | boolean) => '0x' + BigInt(num).toString(16).toUpperCase();

  const encodePayload = (payload: Record<string, any>): string => {
    const jsonString = JSON.stringify(payload);
    let encoded = Buffer.from(jsonString).toString('base64');
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
      setSignatures('- 1 of 2')
      if (!activeUserAddress) throw new Error("No account selected");
      await validateandSwitchChain(ERC20Chain)

      const availBalance = await getERC20AvailBalance(ERC20Chain);
      if (new BigNumber(atomicAmount).gte(new BigNumber(availBalance))) {
        throw new Error("insufficient balance");
      }

      /**IMPORTANT: FOR BASE WHY IS THERE NO BLOCKHASH THAT SHOWS IN THEIR EXPLORER? */
      const hash = await transferERC20AvailToLiquidityBridge(atomicAmount, ERC20Chain)
      if (!hash) throw new Error("Failed to transfer to liquidity bridge")
      setSignatures('- 2 of 2')

      const payload = {
        sender_address: activeUserAddress,
        tx_hash: hash.txnHash,
        avl_receiver_address: destinationAddress,
        amount: toHex(atomicAmount),
      };
      const encodedPayload = encodePayload(payload);

      console.log("Payload: ", payload, encodedPayload);

      const sig = await personalSign(config, {
        message: encodedPayload, 
      })
      if (!sig) {
        throw new Error("Failed to sign payload")
      }

      console.log("Signature: ", sig)

      const isValid = await verifyMessage(config,{ 
        address: activeUserAddress,
        message: encodedPayload,
        signature: sig,
      })
      if (!isValid) {
        throw new Error("Invalid Signature")
      }

      console.log("Signature: ", isValid, sig)

      const publicKey = await recoverPublicKey({
        //if not hashed the ethereum way it can't recover the right address and pub key
        hash: hashMessage(encodedPayload),
        signature: sig
      })
      const address = publicKeyToAddress(publicKey)
      if (!publicKey) {
        throw new Error("Failed to recover public key")
      }

      console.log("Public Key: ", publicKey)
      console.log("Address of pub key: ", address)
      
      const response = await sendPayload(encodePayload(payload), sig, "eth_to_avail", publicKey);
      if (response.isErr()) {
        throw new Error(` ${response.error}`);
      }

      Logger.info(
        `LIQUIDITY_BRIDGE INIT_SUCCESS ${hash.txnHash} receiver_address: ${destinationAddress} sender_address: ${activeUserAddress} amount: ${atomicAmount} flow: ${ERC20Chain} -> AVAIL`
      );

      return {
        chain: ERC20Chain,
        hash: hash.txnHash,
        id: response.value.id
      }

    } catch (error: any) {
      Logger.error(
        `LIQUIDITY_BRIDGE INIT_FAILED: ${error.message}`,
        ["receiver_address", destinationAddress],
        ["sender_address", activeUserAddress],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", `${ERC20Chain} -> AVAIL`], 
      );
      throw new Error(`${error.message} : Failed to bridge from ${ERC20Chain} to Avail`);
    } finally {
      setSignatures('')
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
     * 3. send payload at /v1/avail_to_eth
     *
     */
    try {
      if (selected === undefined || selected === null) {
        throw new Error("No account selected");
      }
      setSignatures('- 1 of 2')
      if (!api || !api.isConnected || !api.isReady) await ensureConnection();
      if (!api?.isReady)
        throw new Error("Uh oh! Failed to connect to Avail Api");

      const availBalance = await getTokenBalance(
        Chain.AVAIL,
        selected.address,
        api
      );
      if (!availBalance) {
        throw new Error("Failed to fetch balance");
      }

      if (
        availBalance &&
        new BigNumber(atomicAmount).gt(
          new BigNumber(availBalance).times(ONE_POWER_EIGHTEEN)
        )
      ) {
        throw new Error("insufficient avail balance");
      }
      const result = await transfer(atomicAmount, selected, api);
      if (result.isErr()) {
        throw new Error(`AVAIL_TRANSFER_FAILED ${result.error}`);
      }
      setSignatures('- 2 of 2')

      if (!result.value.txIndex || !result.value.blockhash) {
        throw new Error("Failed to get blockhash and tx_index");
      }

      const payload = {
        sender_address: substrateAddressToPublicKey(selected.address),
        tx_index: result.value.txIndex,
        block_hash: result.value.blockhash,
        eth_receiver_address: destinationAddress,
        amount: toHex(atomicAmount),
      };

      const sig = await signMessage(encodePayload(payload), selected);
      if (sig.isErr()) {
        throw new Error(`${sig.error} : Failed to sign payload`);
      }
      
      //NOTE: to be passed as base64 encoded string
      const response = await sendPayload(encodePayload(payload), sig.value, "avail_to_eth");
      if (response.isErr()) {
        throw new Error(` ${response.error} : Failed to send payload`);
      }
      Logger.info(
        `LIQUIDITY_BRIDGE INIT_SUCCESS ${result.value.txHash} receiver_address: ${destinationAddress} sender_address: ${selected?.address} amount: ${atomicAmount} flow: AVAIL -> ${ERC20Chain}`
      );

      return {
        chain: Chain.AVAIL,
        hash: result.value.txHash,
        id: response.value.id
      };
    } catch (error: any) {
      Logger.error(
        `LIQUIDITY_BRIDGE INIT_FAILED: ${error.message}`,
        ["receiver_address", destinationAddress],
        ["sender_address", selected?.address],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", `AVAIL -> ${ERC20Chain}`],
      );

      throw new Error(`${error.message} Failed to bridge from Avail to ${ERC20Chain}`);
    } finally {
      setSignatures("")
    }
  };

  return {
    initAvailToERC20AutomaticBridging,
    initERC20toAvailAutomaticBridging,
  };
}
