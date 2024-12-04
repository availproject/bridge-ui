import { useAvailAccount } from "@/stores/availWalletHook";
import { useCommonStore } from "@/stores/common";
import { useEffect, useCallback, useRef } from "react";
import useTransactions from "./useTransactions";
import { useAccount } from "wagmi";
import { Chain, TransactionStatus } from "@/types/common";
import { _getBalance, initApi } from "@/utils/common";
import { Logger } from "@/utils/logger";
import {
  fetchAvlHead,
  fetchEthHead,
} from "@/services/api";

const useAppInit = () => {
  const { selected } = useAvailAccount();
  const account = useAccount();
  const {
    api,
    setApi,
    setPendingTransactionsNumber,
    setReadyToClaimTransactionsNumber,
  } = useCommonStore();
  const { pendingTransactions } = useTransactions();
  
  const isInitialized = useRef(false);

  const fetchTokenPrice = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
    }
    const data = await response.json();
    return data.price.avail.usd;
  };

  const fetchBalances = useCallback(async () => {
    let balances: {
      eth: string | undefined;
      avail: string | undefined;
    } = { eth: undefined, avail: undefined };

    if (account.address && api?.isConnected) {
      try {
        balances.eth = await _getBalance(Chain.ETH, api, undefined, account.address);
      } catch (error: any) {
        Logger.error("Failed to fetch ETH balance:", error);
      }
    }

    if (selected?.address && api?.isConnected) {
      try {
        balances.avail = await _getBalance(Chain.AVAIL, api, selected?.address);
      } catch (error: any) {
        Logger.error("Failed to fetch AVAIL balance:", error);
      }
    }

    return balances;
  }, [account.address, api, selected?.address]);

  const fetchHeads = useCallback(async () => {
    try {
      let currentApi = api;
      if(!currentApi || !currentApi.isConnected) {
        Logger.debug("Retrying API Conn");
        currentApi = await initApi();
        setApi(currentApi);
        if (!currentApi || !currentApi.isConnected) {
          throw new Error("RPC under stress, error initialising api");
        }
      }

      const [ethHeadRes, avlHeadRes] = await Promise.all([
        fetchEthHead(),
        fetchAvlHead(currentApi)
      ]);

      return {
        ethHead: ethHeadRes.data,
        avlHead: avlHeadRes.data,
      };
    } catch (error) {
      Logger.error(`ERROR_FETCHING_HEADS: ${error}`);
      throw error;
    }
  }, [api, setApi]);


  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    (async () => {
      try {
        const initializedApi = await initApi();
        setApi(initializedApi);
      } catch (error) {
        Logger.error(`ERROR_INITIALISING_API: ${error}`);
      }
    })();
  }, [setApi]);

  useEffect(() => {
    const pendingCount = pendingTransactions.filter(
      t => t.status !== TransactionStatus.CLAIMED
    ).length;
    
    const readyToClaimCount = pendingTransactions.filter(
      t => t.status === TransactionStatus.READY_TO_CLAIM
    ).length;

    setPendingTransactionsNumber(pendingCount);
    setReadyToClaimTransactionsNumber(readyToClaimCount);
  }, [pendingTransactions, setPendingTransactionsNumber, setReadyToClaimTransactionsNumber]);

  return {
    refetchBalances: fetchBalances,
    refetchHeads: fetchHeads,
    fetchTokenPrice,

  };
};

export default useAppInit;