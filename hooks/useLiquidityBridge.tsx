/**
 * TODO: params include from chain, to chain, amount, destination address
 */

import { ONE_POWER_EIGHTEEN } from "@/constants/bigNumber";
import { getTokenBalance } from "@/services/contract";
import { transfer } from "@/services/pallet";
import { useApi } from "@/stores/api";
import { useAvailAccount } from "@/stores/availwallet";
import { Chain } from "@/types/common";
import { substrateAddressToPublicKey } from "@/utils/common";
import BigNumber from "bignumber.js";

export default function useLiquidityBridge() {
  const { selected } = useAvailAccount();
  const { api, ensureConnection } = useApi();

  interface IAvailToERC20AutomaticBridging {
    ERC20Chain: Chain;
    atomicAmount: string;
    destinationAddress: string;
  }

  const initAvailToERC20AutomaticBridging = async ({
    ERC20Chain,
    atomicAmount,
    destinationAddress,
  }: IAvailToERC20AutomaticBridging) => {
    /**
     * 0. initial checks
     * 1. balance transfer to pool account
     * 2. use blockhash, tx_index and other fields to form a payload
     * 3. generate suignature (X-Payload-Signature to the Sr25519 signature)
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
        throw new Error("AVAIL_TRANSFER_FAILED", result.error);
      }

      const body = {
            sender_address: substrateAddressToPublicKey(selected.address),
            tx_index: result.value.txIndex,
            block_hash: result.value.blockhash,
            eth_receiver_address: destinationAddress,
            amount: atomicAmount,
        };

            
    
      
    } catch (error) {
      throw new Error(`Failed to bridge from Avail to ${ERC20Chain}: ${error}`);
    }
  };

  return { initAvailToERC20AutomaticBridging }; }
