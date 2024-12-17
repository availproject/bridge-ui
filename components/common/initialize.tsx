"use client";

import { useEffect } from "react";
import useAppInit from "@/hooks/useAppInit";
import { useCommonStore } from "@/stores/common";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { Logger } from "@/utils/logger";
import useSWR, { SWRConfiguration } from "swr";
import { useAvailAccount } from "@/stores/availWalletHook";
import { pollWithDelay } from "@/utils/poller";
import { Chain } from "@/types/common";
import { useTransactionsStore } from "@/stores/transactionsStore";
import { getTransactionsFromIndexer } from "@/services/transactions";
import useEthWallet from "@/hooks/useEthWallet";

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateOnMount: true,
};

export function Initialize() {
  const { api, setEthBalance, setAvailBalance, setDollarAmount } =
    useCommonStore();
  const { selected } = useAvailAccount();
  const { activeUserAddress } = useEthWallet();
  const { setTransactionLoader, setIndexedTransactions } =
    useTransactionsStore();
  const { setEthHead, setAvlHead } = useLatestBlockInfo();
  const { refetchBalances, refetchHeads, fetchTokenPrice } = useAppInit();
  const { data: initialFetchDone, mutate: setInitialFetchDone } = useSWR(
    "initialFetch",
    null,
    {
      ...swrConfig,
      fallbackData: false,
    }
  );

  const fetchTransactions = async ({
    availAddress,
    ethAddress,
    sourceChain,
    destinationChain,
  }: {
    availAddress?: string;
    ethAddress?: string;
    sourceChain?: Chain;
    destinationChain?: Chain;
  }) => {
    try {
      setTransactionLoader(true);
      const indexedTransactions = await getTransactionsFromIndexer({
        availAddress: availAddress,
        ethAddress: ethAddress,
        sourceChain: sourceChain,
        destinationChain: destinationChain,
      });
      setIndexedTransactions(indexedTransactions);
    } catch (error) {
      Logger.error(`ERROR_FETCHING_TRANSACTIONS: ${error}`);
    } finally {
      setTransactionLoader(false);
    }
  };

  useEffect(() => {
    if (!selected?.address && !activeUserAddress) {
      return;
    }
    pollWithDelay(
      fetchTransactions,
      [
        {
          availAddress: selected?.address,
          ethAddress: activeUserAddress,
        },
      ],
      80
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.address, activeUserAddress]);

  useEffect(() => {
    if (!initialFetchDone && api?.isConnected) {
      const fetchInitialData = async () => {
        try {
          const [priceData, balancesData, headsData] = await Promise.all([
            fetchTokenPrice("/api/getTokenPrice?coins=avail&fiats=usd"),
            refetchBalances(),
            refetchHeads(),
          ]);

          setDollarAmount(priceData);
          setEthBalance(balancesData.eth);
          setAvailBalance(balancesData.avail);
          setEthHead(headsData.ethHead);
          setAvlHead(headsData.avlHead);

          setInitialFetchDone(true);
        } catch (error) {
          Logger.error(`ERROR_INITIAL_DATA_FETCH: ${error}`);
        }
      };

      fetchInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api?.isConnected, initialFetchDone]);

  return null;
}
