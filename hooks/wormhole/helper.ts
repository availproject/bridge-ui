import { Chain as IChain, TransactionStatus } from "@/types/common";
import { Transaction } from "@/types/transaction";
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
import { appConfig } from "@/config/default";
import BigNumber from "bignumber.js";
import { WormholeTransaction } from "./types";

export type NttContracts = {
  [key in Chain]?: Ntt.Contracts;
};

const removeSpaces = (str: String) => str.replace(/\s+/g, '');

export const NTT_CONTRACTS: NttContracts = {
  [removeSpaces(appConfig.networks.ethereum.name)]: {
    manager: appConfig.contracts.ethereum.manager,
    token:  appConfig.contracts.ethereum.availToken,
    transceiver: {
      wormhole: appConfig.contracts.ethereum.transceiver.wormhole,
      pauser: appConfig.contracts.ethereum.transceiver.pauser,
    },
  },
  [removeSpaces(appConfig.networks.base.name)]: {
    manager: appConfig.contracts.base.manager,
    token: appConfig.contracts.base.availToken,
    transceiver: {
      wormhole: appConfig.contracts.base.transceiver.wormhole,
      pauser: appConfig.contracts.base.transceiver.pauser,
    },
  },
};
  
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

 export function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
  
  
  export interface SignerStuff<N extends Network, C extends Chain> {
    chain: ChainContext<N, C>;
    signer: Signer<N, C>;
    address: ChainAddress<C>;
  }
  
  export type IAddress = `0x${string}`
  
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
      throw new Error("The amount requested is too low to cover the fee and any native gas requested.");
  
    console.log("Starting transfer ------ ");
  
    const srcTxids = await xfer.initiateTransfer(route.sourceSigner);
  
    console.log(`${route.sourceSigner.chain()} Trasaction ID: ${srcTxids[0]}`);
  
    console.log(`Wormhole Trasaction ID: ${srcTxids[1] ?? srcTxids[0]}`);
  
    console.log("Transfer completed successfully");
  }

  const SUPPORTED_CHAINS = {
    SEPOLIA: 10002,
    BASE_SEPOLIA: 10004
  };

  const mapChainIdToEnum = (chainId: number): IChain => {
    switch(chainId) {
      case SUPPORTED_CHAINS.SEPOLIA:
        return IChain.ETH;
      case SUPPORTED_CHAINS.BASE_SEPOLIA:
        return IChain.BASE;
      default:
        return IChain.ETH;
    }
  };

export const fetchWormholeTransactions = async (isPolling = false, address: IAddress | undefined): Promise<Transaction[]> => {
    if (!address) {
        return [];
    }

    try {
      const response = await fetch(
        appConfig.config === 'mainnet' ? `https://api.wormholescan.io/api/v1/operations?address=${address}&page=0&pageSize=50&sortOrder=DESC` :
        `https://api.testnet.wormholescan.io/api/v1/operations?address=${address}&page=0&pageSize=50&sortOrder=DESC`
      );
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();

     return data.operations
        .filter((tx: WormholeTransaction) => {
          const sourceChainId = tx.sourceChain.chainId;
          const destChainId = tx.content.standarizedProperties.toChain;
          return (
            (sourceChainId === SUPPORTED_CHAINS.SEPOLIA && destChainId === SUPPORTED_CHAINS.BASE_SEPOLIA) ||
            (sourceChainId === SUPPORTED_CHAINS.BASE_SEPOLIA && destChainId === SUPPORTED_CHAINS.SEPOLIA)
          );
        })
        .map((tx: WormholeTransaction) => ({
          status: tx.targetChain?.status === 'completed' 
            ? TransactionStatus.CLAIMED 
            : TransactionStatus.BRIDGED,
          sourceChain: mapChainIdToEnum(tx.sourceChain.chainId),
          destinationChain: mapChainIdToEnum(tx.content.standarizedProperties.toChain),
          amount: (new BigNumber(tx.content.payload.parsedPayload.nttMessage.trimmedAmount.amount).dividedBy(new BigNumber(10).pow(tx.content.payload.parsedPayload.nttMessage.trimmedAmount.decimals))).multipliedBy(new BigNumber(10).pow(18)).toFixed(0),
          depositorAddress: tx.content.standarizedProperties.fromAddress,
          receiverAddress: tx.content.standarizedProperties.toAddress,
          sourceTransactionHash: tx.sourceChain.transaction.txHash,
          sourceTimestamp: tx.sourceChain.timestamp,
          destinationTransactionHash: `0x${tx.targetChain?.transaction.txHash}`,
          destinationTransactionTimestamp: tx.targetChain 
            ? new Date(tx.targetChain.timestamp).getTime() 
            : undefined
        })) as Transaction[];

    } catch (err) {
      throw err;
    }
  };
