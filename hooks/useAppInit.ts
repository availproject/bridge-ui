/* eslint-disable react-hooks/exhaustive-deps */
import { useAvailAccount } from "@/stores/availWalletHook";
import { useCommonStore } from "@/stores/common";
import { pollWithDelay } from "@/utils/poller";
import { ApiPromise, isConnected } from "avail-js-sdk";
import { useEffect } from "react";
import useTransactions from "./useTransactions";
import { useAccount } from "wagmi";
import { appConfig } from "@/config/default";
import { Chain, TransactionStatus } from "@/types/common";
import { _getBalance, initApi } from "@/utils/common";
import { Logger } from "@/utils/logger";
import {
  fetchAvlHead,
  fetchEthHead,
  fetchLatestBlockhash,
} from "@/services/api";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";

const useAppInit = () => {
  const { selected } = useAvailAccount();
  const account = useAccount();
  const {
    api,
    setApi,
    setPendingTransactionsNumber,
    setReadyToClaimTransactionsNumber,
    setDollarAmount,
    setEthBalance,
    setAvailBalance,
  } = useCommonStore();
  const { fetchTransactions } = useTransactions();
  const { pendingTransactions } = useTransactions();
  const { setAvlHead, setEthHead, setLatestBlockhash } = useLatestBlockInfo();

  const fetchHeads = async (api: ApiPromise) => {
    try {
      let retriedApiConn: ApiPromise | null = null;
      Logger.info("FETCHING_HEADS");

      if(!api || !api.isConnected) {
        Logger.debug("Retrying API Conn");
        retriedApiConn = await initApi();
        setApi(retriedApiConn);
        if (!retriedApiConn) {
          throw new Error("Uh Oh! RPC under a lot of stress, error intialising api");}
      }
      const ethHead = await fetchEthHead();
      setEthHead(ethHead.data);
      const LatestBlockhash = await fetchLatestBlockhash(ethHead.data.slot);
      setLatestBlockhash(LatestBlockhash.data);
      const avlHead = await fetchAvlHead(api ? api : retriedApiConn!);
      setAvlHead(avlHead.data);

      return {
        ethHead: ethHead.data,
        avlHead: avlHead.data,
        latestBlockhash: LatestBlockhash.data,
      }

    } catch (error) {
      Logger.error(`ERROR_FETCHING_HEADS: ${error}`);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setApi(await initApi());
      } catch (error) {
        Logger.error(`ERROR_INITIALISING_API: ${error}`);
      }
    })();
  }, []);

  useEffect(() => {
    if (!api) return;
  
    pollWithDelay(
      fetchHeads,
      [api],
      appConfig.bridgeHeadsPollingInterval,
      () => true
    );
    fetchHeads(api);
  }, [isConnected()]);
  
  useEffect(() => {
    if ((!selected?.address && !account.address)) return;
  
    pollWithDelay(
      fetchTransactions,
      [{ availAddress: selected?.address, ethAddress: account.address }],
      appConfig.bridgeIndexerPollingInterval,
      () => true
    );
  }, [selected?.address, account.address]);
  
  useEffect(() => {
    pollWithDelay(
      getTokenPrice,
      [{ coin: "avail", fiat: "usd" }],
      appConfig.bridgePricePollingInterval,
      () => true
    );
  }, []);

  useEffect(() => {
    setPendingTransactionsNumber(
      pendingTransactions.filter(
        (transaction) => transaction.status !== TransactionStatus.CLAIMED
      ).length
    );
    setReadyToClaimTransactionsNumber(
      pendingTransactions.filter(
        (transaction) => transaction.status === TransactionStatus.READY_TO_CLAIM
      ).length
    );
  }, [pendingTransactions]);

  const fetchBalances = async () => {
    if (account.address && api) {
      try {
        const result = await _getBalance(
          Chain.ETH,
          api,
          undefined,
          account.address
        );
        setEthBalance(result);
      } catch (error) {
        console.error("Failed to fetch ETH balance:", error);
        setEthBalance(undefined);
      }
    } else {
      setEthBalance(undefined);
    }

    if (selected?.address && api) {
      try {
        const result = await _getBalance(Chain.AVAIL, api, selected?.address);
        setAvailBalance(result);
      } catch (error) {
        console.error("Failed to fetch AVAIL balance:", error);
        setAvailBalance(undefined);
      }
    } else {
      setAvailBalance(undefined);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [account.address, selected?.address, api]);

  /**
   * @description get the price of the token
   *
   * @param {coin, fiat}
   * @sets price of the token in dollars
   */
  async function getTokenPrice({ coin, fiat }: { coin: string; fiat: string }) {
    try {
      const response = await fetch(
        `/api/getTokenPrice?coins=${coin}&fiats=${fiat}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
      }
  
      const data = await response.json();
      setDollarAmount(data.price[coin][fiat]);
    } catch (error: any) {
      Logger.error(`ERROR_FETCHING_TOKEN_PRICE: ${error}`);
    }
  }
  return { fetchBalances, getTokenPrice, fetchHeads };
};

export default useAppInit;
