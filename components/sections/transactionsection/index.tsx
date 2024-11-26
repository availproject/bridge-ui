"use client";

import { FaHistory } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Table, TableBody, TableCell, TableRow } from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Chain } from "@/types/common";
import useTransactions from "@/hooks/useTransactions";
import { parseAvailAmount } from "@/utils/parsers";
import { ChainLabel } from "../../ui/chainLabel";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock,
  MoveRight,
} from "lucide-react";
import useClaim from "@/hooks/useClaim";
import { useEffect, useMemo, useState } from "react";
import { LoadingButton } from "../../ui/loadingbutton";
import { Transaction } from "@/types/transaction";
import { CiCircleQuestion } from "react-icons/ci";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { Logger } from "@/utils/logger";
import { showFailedMessage } from "@/utils/toasts";
import { getStatusTime } from "@/utils/common";
import TxnAddresses from "./txnaddresses";
import ParsedDate from "./parseddate";
import CompletedTransactions from "./completedtransactions";
import NoTransactions from "./notransactions";
import { SuccessDialog } from "../../common/successClaim";
import { useTransactionsStore } from "@/stores/transactionsStore";
import Loading from "./loading";
import ErrorDialog from "@/components/common/errorDialog";


export default function TransactionSection() {
  const {
    pendingTransactions,
    completedTransactions,
    paginatedCompletedTransactions,
    paginatedPendingTransactions,
  } = useTransactions();
  const { avlHead, ethHead } = useLatestBlockInfo();
  const { initClaimAvailToEth, initClaimEthtoAvail } = useClaim();
  const {transactionLoader } = useTransactionsStore();

  const [showPagination, setShowPagination] = useState(false);
  const [errorDialog, setErrorDialog] = useState(false);
  const [error, setError] = useState<Error | string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pendingTab, setPendingTab] = useState<boolean>(true);

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    destinationChain: Chain;
    destinationTxnHash: string;
  }>({
    isOpen: false,
    destinationChain: Chain.ETH,
    destinationTxnHash: "",
  });

  const [loadingTxns, setLoadingTxns] = useState(new Set());
  const [completedTxns, setCompletedTxns] = useState(new Set());

  useEffect(() => {
    setCurrentPage(0);
  }, [pendingTab]);

  const shouldShowPagination = useMemo(() => {
    if (pendingTab) {
      return paginatedPendingTransactions.length > 1;
    }
    return paginatedCompletedTransactions.length > 1;
  }, [paginatedCompletedTransactions.length, paginatedPendingTransactions.length, pendingTab]);
  
  useEffect(() => {
    setShowPagination(shouldShowPagination);
  }, [shouldShowPagination]);

  const isEndPage = pendingTab
    ? currentPage === paginatedPendingTransactions.length - 1
    : currentPage === paginatedCompletedTransactions.length - 1;

  const setTxnLoading = (txnHash: string, isLoading: boolean) => {
    setLoadingTxns((prev) => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(txnHash);
      } else {
        newSet.delete(txnHash);
      }
      return newSet;
    });
  };

  const setTxnCompleted = (txnHash: string) => {
    setCompletedTxns((prev) => new Set(prev).add(txnHash));
  };

  const onSubmit = async (
    chainFrom: Chain,
    blockhash: `0x${string}`,
    txnHash: `0x${string}`,
    sourceTimestamp: string,
    atomicAmount: string,
    sourceTransactionIndex?: number,
    executeParams?: {
      messageid: number;
      amount: string | number;
      from: `${string}`;
      to: `${string}`;
      originDomain: number;
      destinationDomain: number;
    }
  ) => {
    setTxnLoading(txnHash, true);

    try {
      if (chainFrom === Chain.AVAIL && blockhash && sourceTransactionIndex && executeParams) {
        const successBlockhash = await initClaimAvailToEth({
          blockhash,
          sourceTransactionIndex,
          sourceTransactionHash: txnHash,
          sourceTimestamp,
          atomicAmount,
          senderAddress: executeParams.from,
          receiverAddress: executeParams.to,
        });

        if (successBlockhash) {
          setDialogState({
            isOpen: true,
            destinationChain: Chain.ETH,
            destinationTxnHash: successBlockhash,
          });
          setTxnCompleted(txnHash);
        }
      } else if (chainFrom === Chain.ETH && blockhash && executeParams) {
        const successBlockhash = await initClaimEthtoAvail({
          blockhash,
          sourceTransactionHash: txnHash,
          sourceTimestamp,
          atomicAmount,
          executeParams,
        });

        if (successBlockhash.txHash) {
          setDialogState({
            isOpen: true,
            destinationChain: Chain.AVAIL,
            destinationTxnHash: successBlockhash.txHash,
          });
          setTxnCompleted(txnHash);
        }
      } else {
        showFailedMessage({ title: "Invalid Transaction" });
      }
    } catch (e: any) {
      Logger.error(e);
      setError(e);
      setErrorDialog(true);
    } finally {
      setTxnLoading(txnHash, false);
    }
  };

  const SubmitClaim = ({ txn }: { txn: Transaction }) => {
    const isLoading = loadingTxns.has(txn.sourceTransactionHash);

    return (
      <LoadingButton
        variant="primary"
        loading={isLoading}
        disabled={isLoading}
        className="!px-4 !py-0 rounded-xl whitespace-nowrap"
        onClick={async () => {
          await onSubmit(
            txn.sourceChain,
            txn.sourceBlockHash as `0x${string}`,
            txn.sourceTransactionHash,
            txn.sourceTimestamp,
            txn.amount,
            txn.sourceTransactionIndex,
            {
              messageid: txn.messageId,
              amount: txn.amount,
              from: txn.depositorAddress,
              to: txn.receiverAddress,
              originDomain: 1,
              destinationDomain: 2,
            }
          );
        }}
      >
        {txn.status === "READY_TO_CLAIM" ? "Claim Ready" : txn.status}
      </LoadingButton>
    );
  };

  const PendingTransactions = ({
    pendingTransactions,
  }: {
    pendingTransactions: Transaction[];
  }) => {
    return (
      <Table className="flex h-[85%]">
        <TableBody className="overflow-y-scroll min-w-[99%] mx-auto space-y-2.5">
          {pendingTransactions &&
            pendingTransactions.map((txn, index) => (
              <TableRow
                className="flex overflow-x-scroll flex-row justify-between w-[100%] bg-[#363b4f] rounded-xl"
                key={txn.sourceTransactionHash}
              >
                <TableCell className="font-medium flex flex-row rounded-xl">
                  <div className="hidden md:flex">
                    <ParsedDate sourceTimestamp={txn.sourceTimestamp} />
                  </div>

                  <span className="flex flex-col-reverse items-start justify-center">
                    <TxnAddresses
                     txn={txn}
                    />
                    <span className="flex flex-row w-full">
                      <ChainLabel chain={txn.sourceChain} />
                      <p className="md:px-4 px-2">
                        <MoveRight />
                      </p>
                      <ChainLabel
                        chain={
                          txn.sourceChain === Chain.AVAIL ? Chain.ETH : Chain.AVAIL
                        }
                      />
                      <div className="md:hidden flex">
                        <ParsedDate sourceTimestamp={txn.sourceTimestamp} />
                      </div>
                    </span>
                    <span className="flex flex-row space-x-2">
                      <p className="text-white !text-md lg:text-lg font-thicccboisemibold">
                        {parseAvailAmount(txn.amount)} AVAIL
                      </p>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={
                          txn.sourceChain === Chain.ETH
                            ? `${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL}/tx/${txn.sourceTransactionHash}`
                            : `${process.env.NEXT_PUBLIC_SUBSCAN_URL}/extrinsic/${txn.sourceTransactionHash}`
                        }
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </span>
                  </span>
                  <br />
                </TableCell>
                <TableCell className="flex text-right items-center">
                  <div className="flex flex-col space-y-2 justify-between">
                    <span>
                      {txn.status === "READY_TO_CLAIM" ? (
                        <SubmitClaim txn={txn} />
                      ) : (
                        <Badge className="flex-row items-center justify-center space-x-2 bg-[#24262f]">
                          <p className="font-thicccboisemibold whitespace-nowrap">
                            {txn.status === "BRIDGED"
                              ? `In Progress`
                              : txn.status.charAt(0) +
                                txn.status.toLocaleLowerCase().slice(1)}
                          </p>
                          <span className="relative flex h-2 w-2">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                                txn.status === "INITIATED"
                                  ? "bg-yellow-600"
                                  : `${
                                      txn.status === "PENDING"
                                        ? "bg-blue-600"
                                        : "bg-orange-500"
                                    }`
                              } opacity-75`}
                            ></span>
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2  ${
                                txn.status === "INITIATED"
                                  ? "bg-yellow-600"
                                  : `${
                                      txn.status === "PENDING"
                                        ? "bg-blue-600"
                                        : "bg-orange-500"
                                    }`
                              }`}
                            ></span>
                          </span>
                        </Badge>
                      )}
                    </span>
                    <p className="text-xs flex flex-row items-end justify-end text-right text-white text-opacity-70 space-x-1">
                      <span>
                        {getStatusTime({
                          from: txn.sourceChain,
                          status: txn.status,
                          heads: { eth: ethHead, avl: avlHead },
                        })}
                      </span>{" "}
                      <Clock className="w-4 h-4" />
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className=" relative flex flex-col mx-auto w-[95%] h-[100%] ">
      {transactionLoader ? (<Loading/>) :(<>
        <Tabs defaultValue="pending" className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2 !bg-[#33384B] !border-0 mb-2  ">
          <TabsTrigger
            value="pending"
            className=""
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
        <TabsContent value="pending" className="h-full">
          <div className=" h-full">
            {pendingTransactions.length > 0 ? (
              <PendingTransactions
                pendingTransactions={paginatedPendingTransactions[currentPage]}
              />
            ) : (
              <NoTransactions />
            )}
          </div>
        </TabsContent>
        <TabsContent value="history" className="h-full">
          <div className=" h-full ">
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
        </TabsContent>
      </Tabs>
      <SuccessDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        destinationChain={dialogState.destinationChain}
        destinationTxnHash={dialogState.destinationTxnHash}
      />
      {errorDialog && <ErrorDialog
        isOpen={errorDialog}
        onOpenChange={() => setErrorDialog(false)}
        error={error}
        claimDialog={true}
      /> }
      {/* Pagination */}
      {showPagination ? (
        <div className="absolute w-[102%] pt-4 mx-auto bottom-3 -right-0 flex flex-row space-x-2 items-center justify-end bg-[#2B3042]">
          <p className="font-thicccboisemibold text-sm text-white mr-2">
            <HoverCard>
              <HoverCardTrigger className="cursor-pointer">
                <CiCircleQuestion className="w-6 h-6" />
              </HoverCardTrigger>
              <HoverCardContent className="font-thicccboisemibold text-white text-opacity-70">
                Transactions take around ~2 hours to bridge, thank you for your
                patience.
              </HoverCardContent>
            </HoverCard>
          </p>
          <button
            disabled={currentPage === 0}
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
            disabled={isEndPage}
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
      ) : (
        <></>
      )}
      </>) }
      {/* Tabs */}
      
    </div>
  );
}
