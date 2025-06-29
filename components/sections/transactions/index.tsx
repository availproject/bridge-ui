"use client";

import { FaHistory } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import useTransactions from "@/hooks/useTransactions";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CiCircleQuestion } from "react-icons/ci";
import CompletedTransactions from "./completedtransactions";
import NoTransactions from "./notransactions";
import { useTransactionsStore } from "@/stores/transactions";
import { PendingTransactions } from "./pendingtransactions";
import TxnLoading from "./loading";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { capitalizeFirstLetter } from "@/hooks/wormhole/helper";
import { appConfig } from "@/config/default";

export default function TransactionSection() {
  const {
    pendingTransactions,
    completedTransactions,
    paginatedCompletedTransactions,
    paginatedPendingTransactions,
  } = useTransactions();
  const { transactionLoader } = useTransactionsStore();
  const { address } = useAccount();
  const [showPagination, setShowPagination] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pendingTab, setPendingTab] = useState<boolean>(true);

  useEffect(() => {
    setCurrentPage(0);
  }, [pendingTab]);

  const shouldShowPagination = useMemo(() => {
    if (pendingTab) {
      return paginatedPendingTransactions.length > 1;
    }
    return paginatedCompletedTransactions.length > 1;
  }, [
    paginatedCompletedTransactions.length,
    paginatedPendingTransactions.length,
    pendingTab,
  ]);

  useEffect(() => {
    setShowPagination(shouldShowPagination);
  }, [shouldShowPagination]);

  const isEndPage = pendingTab
    ? currentPage === paginatedPendingTransactions.length - 1
    : currentPage === paginatedCompletedTransactions.length - 1;

  return (
    <div className="relative flex flex-col mx-auto w-[95%] h-[100%] ">
      <>
        <Tabs defaultValue="pending" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 !bg-[#33384B] !border-0 mb-2  ">
            <TabsTrigger
              value="pending"
              onClick={() => {
                setPendingTab(true);
              }}
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex flex-row items-center justify-center space-x-1"
              onClick={() => {
                setPendingTab(false);
              }}
            >
              <p>History</p>
              <FaHistory />
            </TabsTrigger>
          </TabsList>
          {transactionLoader ? (
            <TxnLoading />
          ) : (
            <>
              <TabsContent value="pending" className="h-[520px]">
                <div className=" h-full">
                  {pendingTransactions.length > 0 ? (
                    <PendingTransactions
                      pendingTransactions={
                        paginatedPendingTransactions[currentPage]
                      }
                    />
                  ) : (
                    <NoTransactions />
                  )}
                </div>
              </TabsContent>
              <TabsContent value="history" className="h-[520px]">
                <div className="h-full">
                  {completedTransactions.length > 0 ? (
                    <CompletedTransactions
                      completedTransactions={
                        paginatedCompletedTransactions[currentPage]
                      }
                    />
                  ) : (
                    <NoTransactions />
                  )}
                </div>
              </TabsContent>{" "}
            </>
          )}
        </Tabs>
        {/* Pagination */}
        <div className="absolute w-[102%] pt-4 mx-auto bottom-3 -right-0 flex flex-row space-x-2 items-center justify-end bg-[#2B3042]">
          <span className="font-thicccboisemibold text-sm text-white mr-2">
            <HoverCard>
              <HoverCardTrigger className="cursor-pointer underline underline-offset-2 font-ppmori text-white text-opacity-80 ">
                Can&apos;t find your transaction?
              </HoverCardTrigger>
              <HoverCardContent className="font-ppmori bg-[#282B34] text-white text-opacity-70 w-2/3">
                <h2 className="font-ppmori text-white text-lg pb-2">
                  Can&apos;t find your transaction?
                </h2>
                <div className="font-ppmori text-white text-opacity-70">
                  <p className="pb-1">
                    {">"} After transactions are completed they will be moved to
                    the history section.
                  </p>
                  <p className="pb-1">
                    {">"} We fetch transaction data by connected wallet, make
                    sure you`&apos;re connected to the right accounts.
                  </p>
                  <span className="">
                    <span>
                      {">"} All third party wormhole transactions might take a
                      while to propagate, you can also track status on{" "}
                      <span className="text-white">wormhole scan</span> in the
                      meanwhile.
                    </span>
                    <Link
                      href={
                        address
                          ? `https://wormholescan.io/#/txs?address=${address}&network=${
                              capitalizeFirstLetter(appConfig.config) as
                                | "Mainnet"
                                | "Testnet"
                            }`
                          : "https://wormholescan.io/"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-400 pt-1"
                    >
                      See your transactions
                      <ArrowUpRight size={16} />
                    </Link>
                  </span>
                </div>
              </HoverCardContent>
            </HoverCard>
          </span>
          <button
            disabled={currentPage === 0 || !showPagination}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className={`rounded-lg bg-[#484C5D] ${
              currentPage === 0
                ? "cursor-not-allowed bg-opacity-30 text-opacity-40  text-white "
                : " text-white"
            } p-2`}
          >
            <ArrowLeft />
          </button>
          <button
            disabled={isEndPage || !showPagination}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className={`rounded-lg bg-[#484C5D] ${
              isEndPage
                ? "cursor-not-allowed bg-opacity-30 text-opacity-40  text-white "
                : " text-white"
            } p-2`}
          >
            <ArrowRight />
          </button>
        </div>
      </>
    </div>
  );
}
