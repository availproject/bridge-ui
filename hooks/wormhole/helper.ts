import {
    Chain,
    Network,
    Wormhole,
    TokenId,
    TokenTransfer,
    ChainContext,
    isTokenId,
    ChainAddress,
    Signer,
  } from "@wormhole-foundation/sdk";
  import { Ntt } from "@wormhole-foundation/sdk-definitions-ntt";
  import "@wormhole-foundation/sdk-evm-ntt";
  
  export async function getTokenDecimals<
    N extends "Mainnet" | "Testnet" | "Devnet"
  >(
    wh: Wormhole<N>,
    token: TokenId,
    sendChain: ChainContext<N, any>
  ): Promise<number> {
    return isTokenId(token)
      ? Number(await wh.getDecimals(token.chain, token.address))
      : sendChain.config.nativeTokenDecimals;
  }
  export type NttContracts = {
    [key in Chain]?: Ntt.Contracts;
  };

 export function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
  
  export const NTT_CONTRACTS: NttContracts = {
    Sepolia: {
      manager: "0x40E856FD3eCBeE56c33388738f0B1C3aad573353",
      token: "0xb1C3Cb9b5e598d4E95a85870e7812B99f350982d",
      transceiver: {
        wormhole: "0x988140794D960fD962329751278Ef0DD2438a64C",
        pauser: "0x0f62A884eDAbD338e92302274e7cE7Cc1D467B74",
      },
    },
    BaseSepolia: {
      manager: "0xf4B55457fCD2b6eF6ffd41E5F5b0D65fbE370EA3",
      token: "0xf50F2B4D58ce2A24b62e480d795A974eD0f77A58",
      transceiver: {
        wormhole: "0xAb9C68eD462f61Fd5fd34e6c21588513d89F603c",
        pauser: "0x0f62A884eDAbD338e92302274e7cE7Cc1D467B74",
      },
    },
  };
  
  export interface SignerStuff<N extends Network, C extends Chain> {
    chain: ChainContext<N, C>;
    signer: Signer<N, C>;
    address: ChainAddress<C>;
  }
  
  export type IAddress = `0x${string}` | string;
  
  export async function tokenTransfer<N extends Network>(
    wh: Wormhole<N>,
    route: {
      token: TokenId;
      amount: bigint;
      sourceAdd: ChainAddress;
      destAdd: ChainAddress;
      sourceChain: ChainContext<N, any>;
      destChain: ChainContext<N, any>;
      sourceSigner: Signer;
      delivery?: {
        automatic: boolean;
        nativeGas?: bigint;
      };
      payload?: Uint8Array;
    }
  ) {
    const xfer = await wh.tokenTransfer(
      route.token,
      route.amount,
      route.sourceAdd,
      route.destAdd,
      true,
      route.payload,
      route.delivery?.nativeGas
    );
  
    const quote = await TokenTransfer.quoteTransfer(
      wh,
      route.sourceChain,
      route.destChain,
      xfer.transfer
    );
  
    if (xfer.transfer.automatic && quote.destinationToken.amount < 0)
      throw "The amount requested is too low to cover the fee and any native gas requested.";
  
    console.log("Starting transfer ------ ");
  
    const srcTxids = await xfer.initiateTransfer(route.sourceSigner);
  
    console.log(`${route.sourceSigner.chain()} Trasaction ID: ${srcTxids[0]}`);
  
    console.log(`Wormhole Trasaction ID: ${srcTxids[1] ?? srcTxids[0]}`);
  
    console.log("Transfer completed successfully");
  }
  