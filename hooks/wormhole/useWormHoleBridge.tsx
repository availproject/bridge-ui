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
import { Chain, whChainToChain } from "@/types/common";
import { getRpcUrl } from "@/utils/common";

export default function useWormHoleBridge() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const { validateandSwitchChain } = useEthWallet();

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
      const wh = new Wormhole(capitalizeFirstLetter(appConfig.config) as "Mainnet" | "Testnet", [evm.Platform], {
        chains: {
          [whfrom]: {
            rpc: getRpcUrl(whChainToChain(whfrom)),
          },
          [whto]: {
            rpc: getRpcUrl(whChainToChain(whto)),
          },
        },
      });
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

      const add = Wormhole.chainAddress(sendChain.chain, signer.address())
      const destAdd = Wormhole.chainAddress(rcvChain.chain, destinationAddress)
      
      const xfer = () =>
        srcNtt.transfer(add.address, amt, destAdd, {
          queue: false,
          automatic: true,
        });

        const txids: TransactionId[] = await signSendWait(sendChain, xfer(), signer);
        Logger.info(`WORMHOLE_BRIDGE_INITITATE_SUCCESS txids: ${txids &&JSON.stringify(txids)} amount: ${amt} sendChain: ${whfrom} rcvChain: ${whto} address: ${signer.address()}`);

        /**
         * 
         *   addToLocalTransaction({
          sourceChain: switcher,
          // this hardcoding works as of now, since we only have BASE -> ETH and ETH -> BASE, need to switch this with a more robust conditional later, prolly an extra prop?
          destinationChain: switcher === Chain.ETH ? Chain.BASE : Chain.ETH,
          sourceTransactionHash: (txids[1] ? txids[1].txid : txids[0].txid) as `0x${string}`,
          depositorAddress: signer.address(),
          receiverAddress: destinationAddress,
          amount: amt.toString(),
          status: TransactionStatus.INITIATED,
          sourceTimestamp: new Date().toISOString(),
        });
         */
      
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
