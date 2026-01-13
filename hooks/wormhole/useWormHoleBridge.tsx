import {
  amount,
  Chain as WhChain,
  signSendWait,
  TransactionId,
  Wormhole,
  routes,
} from "@wormhole-foundation/sdk";
import { useAccount, useWalletClient } from "wagmi";
import { useCallback } from "react";
import { WagmiWormholeSigner } from "./useWagmiWormholeSIgner";
import evm from "@wormhole-foundation/sdk/platforms/evm";
import "@wormhole-foundation/sdk-evm-ntt";
import { NttExecutorRoute, nttExecutorRoute } from "@wormhole-foundation/sdk-route-ntt";
import { capitalizeFirstLetter, NTT_CONTRACTS, convertToExecutorConfig } from "./helper";
import { appConfig } from "@/config/default";
import { Logger } from "@/utils/logger";
import useEthWallet from "../common/useEthWallet";
import { Chain, whChainToChain } from "@/types/common";
import { getRpcUrl } from "@/utils/common";

export default function useWormHoleBridge() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const { validateandSwitchChain } = useEthWallet();

  interface WormholeBridgeParams {
    whfrom: WhChain;
    whto: WhChain;
    sendAmount: string;
    destinationAddress: string;
    switcher: Chain;
  }

  const initWormholeBridge = useCallback(
    async ({
      whfrom,
      whto,
      sendAmount,
      destinationAddress,
      switcher,
    }: WormholeBridgeParams) => {
      try {
        const wh = new Wormhole(
          capitalizeFirstLetter(appConfig.config) as "Mainnet" | "Testnet",
          [evm.Platform],
          {
            chains: {
              [whfrom]: {
                rpc: getRpcUrl(whChainToChain(whfrom)),
              },
              [whto]: {
                rpc: getRpcUrl(whChainToChain(whto)),
              },
            },
          },
        );
        const sendChain = wh.getChain(whfrom);
        const rcvChain = wh.getChain(whto);

        const srcNttContracts = NTT_CONTRACTS[sendChain.chain];
        const dstNttContracts = NTT_CONTRACTS[rcvChain.chain];
        if (!srcNttContracts) {
          throw new Error(`NTT contracts not found for chain ${sendChain.chain}`);
        }
        if (!dstNttContracts) {
          throw new Error(`NTT contracts not found for chain ${rcvChain.chain}`);
        }

        // Get both Ntt and NttWithExecutor protocols
        const srcNtt = await sendChain.getProtocol("Ntt", { ntt: srcNttContracts });
        const srcNttExecutor = await sendChain.getProtocol("NttWithExecutor", { ntt: srcNttContracts });

        const decimals = await srcNtt.getTokenDecimals();
        const amt = amount.units(amount.parse(sendAmount, decimals));

        if (walletClient) {
          await validateandSwitchChain(switcher);
          const signer = await WagmiWormholeSigner.create(
            walletClient,
            sendChain.chain,
          );

          const srcAddress = Wormhole.chainAddress(sendChain.chain, signer.address());
          const dstAddress = Wormhole.chainAddress(
            rcvChain.chain,
            destinationAddress,
          );

          // Create executor route
          const executorConfig = convertToExecutorConfig(NTT_CONTRACTS);
          const executorRoute = nttExecutorRoute(executorConfig);
          const routeInstance = new executorRoute(wh);

          // Create RouteTransferRequest
          const tr = await routes.RouteTransferRequest.create(wh, {
            source: Wormhole.tokenId(sendChain.chain, srcNttContracts.token),
            destination: Wormhole.tokenId(rcvChain.chain, dstNttContracts.token),
          });

          // Validate params
          const validated = await routeInstance.validate(tr, {
            amount: sendAmount,
          });

          if (!validated.valid) {
            throw new Error(`Validation failed: ${validated.error?.message || 'Unknown error'}`);
          }

          const validatedParams = validated.params as NttExecutorRoute.ValidatedParams;

          // Fetch executor quote
          const routeQuote = await routeInstance.fetchExecutorQuote(tr, validatedParams);

          // Use executor transfer - pass address.address for the AccountAddress type
          const xfer = () =>
            srcNttExecutor.transfer(
              srcAddress.address,
              dstAddress,
              amt,
              routeQuote,
              srcNtt
            );

          const txids: TransactionId[] = await signSendWait(
            sendChain,
            xfer(),
            signer,
          );
          Logger.info(
            `WORMHOLE_BRIDGE_INITITATE_SUCCESS txids: ${txids && JSON.stringify(txids)} amount: ${amt} sendChain: ${whfrom} rcvChain: ${whto} address: ${signer.address()}`,
          );

          return txids;
        } else {
          console.error(`CONNECT ETHEREUM WALLET TO BRIDGE`);
        }
      } catch (e) {
        console.error(e, `FLOW_FAILED`);
        Logger.error(
          `WORMHOLE_BRIDGE_INITITATE_FAILED: ${e}`,
          ["address", address],
          ["amount", sendAmount],
          ["flow", `${whfrom} -> ${whto}`],
        );
        throw new Error(`WORMHOLE_BRIDGE_INITITATE_FAILED: ${e} `);
      }
    },
    [walletClient],
  );

  return {
    initWormholeBridge,
  };
}
