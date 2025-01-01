"use client";

import { useEffect, useState } from "react";
import { waitForTransactionReceipt } from "@wagmi/core";
import { Hash } from "viem";
import { config } from "@/config/walletConfig";
import { Chain } from "@/types/common";
import { checkTransactionStatus } from "../metamask/utils";
import { useApi } from "@/stores/api";

export type TxnLifecyle =
  | "submitted"
  | "processing"
  | "included"
  | "finalised"
  | "error";

interface TransactionProgress {
  status: TxnLifecyle;
  isLoading: boolean;
  error?: Error;
  timeEstimate: string;
}

const getTimeEstimate = (confirmations: number, chain?: Chain, ) => {
  switch (chain) {
    case Chain.ETH:
      return `~${confirmations * 15} seconds`;
    case Chain.AVAIL:
      return "~2 minutes";
    case Chain.BASE:
      return `~${confirmations * 15} seconds`;
    default:
      return "~1 minute";
  }
};
export function useTransactionStatus(
  hash?: Hash,
  chain?: Chain,
  isWormhole?: boolean
) {
  const [progress, setProgress] = useState<TransactionProgress>({
    status: "submitted",
    isLoading: true,
    timeEstimate: getTimeEstimate(2, chain || Chain.ETH)
  });

  const { api, ensureConnection } = useApi();

  useEffect(() => {
    if (!hash || !chain) return;

    const trackTransaction = async () => {
      const logStep = (step: string, data?: any) => {
        console.log(`[TX Tracker][${chain}][${hash}] ${step}`, data || '', "TX");
      };
    
      try {
        logStep('Starting transaction tracking');
        if (!chain) {
          throw new Error('Chain not specified');
        }
    
        const isAvailChain = chain === Chain.AVAIL;
        
        if (isAvailChain) {
          logStep('Processing AVAIL transaction');
          setProgress(prev => ({
            ...prev,
            status: 'included',
            isLoading: true
          }));
    
          if (!api?.isConnected || !api?.isReady) {
            logStep('Ensuring API connection');
            await ensureConnection();
          }
    
          logStep('Checking AVAIL transaction status');
          await checkTransactionStatus(api!, hash, "subscribeFinalizedHeads");
        } else {

          logStep('Processing ETH compatible txns'); 
          setProgress(prev => ({
            ...prev,
            status: 'submitted',
            isLoading: true,
            timeEstimate: '~30 seconds'
          }));
  
          logStep('Transaction details before waiting', {
            hash,
            chainId: config.chains[0]?.id, 
          });
          const initialReceipt = await waitForTransactionReceipt(config, {
            hash,
            timeout: 30_000,
            confirmations: 1,
            onReplaced: (response) => {
              const { reason, transaction } = response;
              logStep('Transaction replacement detected', { reason, newHash: transaction?.hash });
              
              if (reason === 'replaced' && transaction?.hash) {
                trackTransaction();
              }
            },
          });
          logStep('Received initial confirmation', { blockNumber: initialReceipt.blockNumber });
          
          setProgress(prev => ({
            ...prev,
            status: 'included',
            isLoading: true
          }));
    
          logStep('Waiting for final confirmation', hash);
          const finalReceipt = await waitForTransactionReceipt(config, {
            hash,
            confirmations: 2,
          });
          logStep('Received final confirmation', { 
            blockNumber: finalReceipt.blockNumber,
            gasUsed: finalReceipt.gasUsed.toString()
          });
        }
    
        setProgress(prev => ({
          ...prev,
          status: 'finalised',
          isLoading: false
        }));
        logStep('Transaction tracking completed successfully');
    
      } catch (error) {
        logStep('Error tracking transaction', error);
        
        setProgress(prev => ({
          ...prev,
          status: 'error',
          error: error as Error,
          isLoading: false
        }));
      }
    };

    trackTransaction();
  }, [hash]);

  return progress;
}
