/* eslint-disable react-hooks/exhaustive-deps */
import { substrateConfig } from '@/config/walletConfig';
import { useAvailAccount } from '@/stores/availWalletHook';
import { useCommonStore } from '@/stores/common';
import { pollWithDelay } from '@/utils/poller';
import { ApiPromise } from 'avail-js-sdk';
import { useEffect } from 'react';
import useTransactions from './useTransactions';
import { useAccount } from 'wagmi';
import { appConfig } from '@/config/default';
import { Chain, TransactionStatus } from '@/types/common';
import { _getBalance, initApi } from '@/utils/common';
import { Logger } from '@/utils/logger';
import { fetchAvlHead, fetchEthHead } from '@/services/api';
import { useLatestBlockInfo } from '@/stores/lastestBlockInfo';

const useAppInit = () => {
  const { selected } = useAvailAccount();
  const account = useAccount();
  const {
    api,
    setApi,
    pendingTransactionsNumber,
    setPendingTransactionsNumber,
    readyToClaimTransactionsNumber,
    setReadyToClaimTransactionsNumber,
    fromChain,
    dollarAmount,
    setDollarAmount,
    toChain,
    fromAmount,
    toAddress,
    ethBalance,
    setEthBalance,
    availBalance,
    setAvailBalance,
  } = useCommonStore();
  const { fetchTransactions } = useTransactions();
  const { pendingTransactions } = useTransactions();
  const { setAvlHead, setEthHead } = useLatestBlockInfo();

  const fetchHeads = async (api: ApiPromise) => {
    try {
      Logger.info("FETCH_HEADS");
      const ethHead = await fetchEthHead();
      if(!ethHead.data) throw new Error("Failed to fetch ETH head");
      setEthHead(ethHead.data);
      const avlHead = await fetchAvlHead(api);
      if(!avlHead.data) throw new Error("Failed to fetch ETH head");
      setAvlHead(avlHead.data);
    } catch (error) {
      Logger.error(`ERROR_FETCH_HEADS: ${error}`);

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

    const startPolling = () => {
      fetchHeads(api);

      if (selected?.address || account.address) {
        pollWithDelay(
          fetchTransactions,
          [{ availAddress: selected?.address, ethAddress: account.address }],
          appConfig.bridgeIndexerPollingInterval,
          () => true
        );

        pollWithDelay(
          getTokenPrice,
          [{ coin: "avail", fiat: "usd" }],
          appConfig.bridgeIndexerPollingInterval,
          () => true
        );
      }
    };

    startPolling();
  }, [api, selected, account.address]);

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
        const result = await _getBalance(Chain.ETH, api, undefined, account.address);
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
      const data = await response.json();
      setDollarAmount(data.price[coin][fiat]);
    } catch (error: any) {
      Logger.error(`ERROR_FETCH_TOKEN_PRICE: ${error}`);
      throw error;
    }
  }

  return { fetchBalances, getTokenPrice };
}





export default useAppInit;
