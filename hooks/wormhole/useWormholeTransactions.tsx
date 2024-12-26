"use client";

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export type WormholeTransaction = {
  id: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed';
  sourceChain: {
    chainId: number;
    txHash: string;
    timestamp: string;
  };
  destinationChain?: {
    chainId: number;
    txHash: string;
    timestamp: string;
  };
  amount: {
    value: string;
    decimals: number;
  };
  direction: 'outgoing' | 'incoming';
};

export const useWormholeTransactions = (pollingInterval = 20000) => {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<WormholeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SUPPORTED_CHAINS = {
    SEPOLIA: 10002,
    BASE_SEPOLIA: 10004
  };

  const fetchTransactions = async (isPolling = false) => {
    if (!address) return;
    console.log('Fetching transactions...');
    try {
      if (!isPolling) setIsLoading(true);
      if (isPolling) setIsRefetching(true);
      
      const response = await fetch(
        `https://api.testnet.wormholescan.io/api/v1/operations?address=${address}&page=0&pageSize=50&sortOrder=DESC`
      );
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      
      const processedTxs = data.operations
        .filter((tx: any) => {
          const sourceChainId = tx.sourceChain.chainId;
          const destChainId = tx.content.standarizedProperties.toChain;
          return (
            (sourceChainId === SUPPORTED_CHAINS.SEPOLIA && destChainId === SUPPORTED_CHAINS.BASE_SEPOLIA) ||
            (sourceChainId === SUPPORTED_CHAINS.BASE_SEPOLIA && destChainId === SUPPORTED_CHAINS.SEPOLIA)
          );
        })
        .map((tx: any) => ({
          id: tx.id,
          timestamp: tx.sourceChain.timestamp,
          status: !tx.targetChain 
            ? 'pending'
            : tx.targetChain.status === 'completed'
              ? 'completed'
              : 'processing',
          sourceChain: {
            chainId: tx.sourceChain.chainId,
            txHash: tx.sourceChain.transaction.txHash,
            timestamp: tx.sourceChain.timestamp
          },
          destinationChain: tx.targetChain ? {
            chainId: tx.targetChain.chainId,
            // chainName: SUPPORTED_CHAINS[tx.targetChain.chainId as number] as string,
            txHash: tx.targetChain.transaction.txHash,
            timestamp: tx.targetChain.timestamp
          } : undefined,
          amount: {
            value: tx.content.payload.parsedPayload.nttMessage.trimmedAmount.amount,
            decimals: tx.content.payload.parsedPayload.nttMessage.trimmedAmount.decimals
          },
          direction: tx.sourceChain.from.toLowerCase() === address.toLowerCase() 
            ? 'outgoing' 
            : 'incoming'
        }));

      setTransactions(processedTxs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchTransactions();
      const interval = setInterval(() => fetchTransactions(true), pollingInterval);
      return () => clearInterval(interval);
    }
  }, [address, pollingInterval]);

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    transactions: sortedTransactions,
    isLoading,
    isRefetching,
    error,
    refetch: () => fetchTransactions()
  };
};