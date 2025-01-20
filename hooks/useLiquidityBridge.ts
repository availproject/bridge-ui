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
import { chainToAddresses, chainToChainId } from "@/components/common/utils";
import { writeContract } from "@wagmi/core";
import { config } from "@/config/walletConfig";
import { appConfig } from "@/config/default";
import availTokenAbi from "@/constants/abis/availTokenAbi.json";

export default function useLiquidityBridge() {
  const { selected } = useAvailAccount();
  const { api, ensureConnection } = useApi();
  const { activeUserAddress, validateandSwitchChain, getERC20AvailBalance } = useEthWallet();

  interface ILiquidtyBridgeParams {
    ERC20Chain: Chain;
    atomicAmount: string;
    destinationAddress: string;
  }

  const initAvailToERC20AutomaticBridging = async ({
    ERC20Chain,
    atomicAmount,
    destinationAddress,
  }: ILiquidtyBridgeParams) => {
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

      if (!result.value.txIndex || !result.value.blockhash) {
        throw new Error("Failed to get blockhash and tx_index");
      }

      const payload = {
        sender_address: substrateAddressToPublicKey(selected.address),
        tx_index: result.value.txIndex,
        block_hash: result.value.blockhash,
        eth_receiver_address: destinationAddress,
        amount: atomicAmount,
      };

      const fakeBody = {
        sender_address:
          "0xf86aabc41a7238174bbc254d47555ee89e1fa4fe3db0f51d19b1b8849cbcaa59",
        tx_index: 1,
        block_hash:
          "0x87a7aec8963dcd11e94fa2c443484683ecf2bd85e3740191cb2a7120788cd345",
        eth_receiver_address: "0xEAfDB6af7c1131Eec88Ef17f1057190A46a6C012",
        amount: "120000000000000000",
      };
      console.log(fakeBody, "FAKE BODY");

      const sig = await signMessage(JSON.stringify(fakeBody), selected);
      console.log(sig, "SIG");
      if (sig.isErr()) {
        throw new Error(`${sig.error} : Failed to sign payload`);
      }

      const response = await sendPayload(fakeBody, `${sig.value}`);
      console.log(response, "response");
      if (response.isErr()) {
        throw new Error(` ${response.error} : Failed to send payload`);
      }

      return {
        chain: Chain.AVAIL,
        hash: result.value.txHash,
      };
    } catch (error) {
      throw new Error(`Failed to bridge from Avail to ${ERC20Chain}: ${error}`);
    }
  };

  async function transferERC20AvailToLiquidityBridge(amount: string, ERC20Chain: Chain) {
    try {
      const hash  = await writeContract(config, {
        address: chainToAddresses(ERC20Chain).tokenAddress as `0x${string}`,
        abi: availTokenAbi,
        functionName: 'transfer',
        args: [chainToAddresses(ERC20Chain).liquidityBridgeAddress, amount]
      })
      return hash
    } catch (error) {
      console.error('Transfer To Liquidity Bridge Failed:', error)
      throw error
    }
  }
  

  const initERC20toAvailAutomaticBridging = async ({
    ERC20Chain,
    atomicAmount,
    destinationAddress,
  }: ILiquidtyBridgeParams) => {
    /**
     * 1. initial checks
     * 2. balance transfer to pool account
     * 3. use blockhash, tx_index and other fields to form a payload
     * 4. generate signature (X-Payload-Signature to the ECDSA signature)
     * 5. send payload at /v1/eth_to_avail
     */

    try {
      if (!activeUserAddress) throw new Error("No account selected");

      await validateandSwitchChain(ERC20Chain)

      const availBalance = await getERC20AvailBalance(chainToChainId(ERC20Chain));
      if (new BigNumber(atomicAmount).gte(new BigNumber(availBalance))) {
        throw new Error("insufficient balance");
      }

      const hash = await transferERC20AvailToLiquidityBridge(atomicAmount, ERC20Chain)
      if (!hash) throw new Error("Failed to transfer to liquidity bridge")

      const payload = {
        sender_address: activeUserAddress,
        tx_index: 1,
        block_hash: "0x87a7aec8963dcd11e94fa2c443484683ecf2bd85e3740191cb2a7120788cd345",
        eth_receiver_address: destinationAddress,
        amount: atomicAmount,
      };




    } catch (error) {
      throw new Error(`Failed to bridge from ${ERC20Chain} to Avail: ${error}`);
    }
  };

  return {
    initAvailToERC20AutomaticBridging,
    initERC20toAvailAutomaticBridging,
  };
}
