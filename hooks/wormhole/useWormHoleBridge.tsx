import {
  amount,
  Chain as WhChain,
  signSendWait,
  TransactionId,
  Wormhole,
} from "@wormhole-foundation/sdk";
import { useAccount, useWalletClient } from "wagmi";
import { useCallback } from "react";
import { WagmiWormholeSigner } from "./useWagmiWormholeSIgner";
import evm from "@wormhole-foundation/sdk/platforms/evm";
import { capitalizeFirstLetter, NTT_CONTRACTS } from "./helper";
import { appConfig } from "@/config/default";
import { Logger } from "@/utils/logger";
import useEthWallet from "../common/useEthWallet";
import { Chain } from "@/types/common";
import { chain } from "avail-js-sdk";

export default function useWormHoleBridge() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const { validateandSwitchChain, activeNetworkId } = useEthWallet();

  /**
   * @desc
   *
   * common wormhole script to carry out NTT cross chain transfers
   */
  interface WormholeBridgeParams {
    whfrom: WhChain;
    whto: WhChain;
    sendAmount: string;
    destinationAddress: string;
    switcher: Chain
  }

  const initWormholeBridge = useCallback(async ({
    whfrom,
    whto,
    sendAmount,
    destinationAddress,
    switcher
  }: WormholeBridgeParams) => {
    try {
      const wh = new Wormhole(capitalizeFirstLetter(appConfig.config) as "Mainnet" | "Testnet", [evm.Platform]);
      const sendChain = wh.getChain(whfrom);
      const rcvChain = wh.getChain(whto);

      const srcNtt = await sendChain.getProtocol("Ntt", {
        ntt: NTT_CONTRACTS[sendChain.chain],
      });

     /* const dstNtt = await rcvChain.getProtocol("Ntt", {
        ntt: NTT_CONTRACTS[rcvChain.chain],
      }); **/
      const amt = amount.units(
        amount.parse(sendAmount, await srcNtt.getTokenDecimals())
      );
      if (walletClient) {

      await validateandSwitchChain(switcher);
      const signer = await WagmiWormholeSigner.create(walletClient, sendChain.chain);

      /** ideally they are the same address */
      const add = Wormhole.chainAddress(sendChain.chain, signer.address())
      const destAdd = Wormhole.chainAddress(rcvChain.chain, destinationAddress)
      
      const xfer = () =>
        srcNtt.transfer(add.address, amt, destAdd, {
          queue: false,
          automatic: true,
          gasDropoff: BigInt(1),
        });

        const txids: TransactionId[] = await signSendWait(sendChain, xfer(), signer);
        Logger.info(`WORMHOLE_BRIDGE_INITITATE_SUCCESS ${JSON.stringify(txids)} txids: ${txids.toString()} amount: ${amt} sendChain: ${whfrom} rcvChain: ${whto} address: ${signer.address()}`);
        return txids;

      } else {
        console.error(`CONNECT ETHEREUM WALLET TO BRIDGE`);
      }

    } catch (e) {
      console.error(e,`FLOW_FAILED`);
      Logger.error(
      `WORMHOLE_BRIDGE_INITITATE_FAILED: ${e}`,
        ["address", address],
        ["amount", sendAmount],
        ["flow", `${whfrom} -> ${whto}`]
      );
      throw new Error(`WORMHOLE_BRIDGE_INITITATE_FAILED: ${e} `);
    }
  }, [walletClient]);

  return {
    initWormholeBridge,
  };
}
