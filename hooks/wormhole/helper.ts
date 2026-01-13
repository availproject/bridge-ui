import { Chain as IChain, TransactionStatus } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { Chain } from "@wormhole-foundation/sdk";
import { Ntt } from "@wormhole-foundation/sdk-definitions-ntt";
import "@wormhole-foundation/sdk-evm-ntt";
import { NttExecutorRoute, NttRoute } from "@wormhole-foundation/sdk-route-ntt";
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
      wormhole: appConfig.contracts.ethereum.transceiver.wormhole
    },
  },
  [removeSpaces(appConfig.networks.base.name)]: {
    manager: appConfig.contracts.base.manager,
    token: appConfig.contracts.base.availToken,
    transceiver: {
      wormhole: appConfig.contracts.base.transceiver.wormhole
    },
  },
};

export function convertToExecutorConfig(nttContracts: NttContracts): NttExecutorRoute.Config {
  const tokenName = "AVAIL";
  const tokens = Object.entries(nttContracts)
    .filter(([_, contracts]) => contracts !== undefined)
    .map(([chain, contracts]) => {
      const executorToken: NttRoute.TokenConfig = {
        chain: chain as Chain,
        token: contracts!.token,
        manager: contracts!.manager,
        transceiver: Object.entries(contracts!.transceiver).map(([type, address]) => ({
          type: type as NttRoute.TransceiverType,
          address: address as string,
        })),
      };
      if (contracts!.quoter) {
        (executorToken as NttRoute.TokenConfig & { quoter?: string }).quoter = contracts!.quoter;
      }
      return executorToken;
    });

  return {
    ntt: {
      tokens: {
        [tokenName]: tokens
      }
    }
  };
}

export function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export type IAddress = `0x${string}`;

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
        appConfig.config === 'mainnet' ? `https://api.wormholescan.io/api/v1/operations?address=${address}&page=0&pageSize=50&sortOrder=DESC&appId=&exclusiveAppId=&from=&payloadType=&sourceChain=&targetChain=&to=` :
        `https://api.testnet.wormholescan.io/api/v1/operations?address=${address}&page=0&pageSize=50&sortOrder=DESC&appId=&exclusiveAppId=&from=&payloadType=&sourceChain=&targetChain=&to=`
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
          status: tx.targetChain
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
