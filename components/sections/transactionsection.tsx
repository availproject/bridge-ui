/* eslint-disable @next/next/no-img-element */

"use client";

import { FaHistory } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { TableBody, TableCell, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Chain, TransactionStatus } from "@/types/common";
import useTransactions from "@/hooks/useTransactions";
import { parseAvailAmount } from "@/utils/parseAmount";
import { ChainLabel } from "../ui/chainLabel";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  parseDateTimeToMonthShort,
  parseDateTimeToDay,
} from "@/utils/parseDateTime";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock,
  ExternalLink,
  MoveRight,
} from "lucide-react";
import useClaim from "@/hooks/useClaim";
import { useEffect, useState } from "react";
import { showFailedMessage, showSuccessMessage } from "@/utils/common";
import { LoadingButton } from "../ui/loadingbutton";
import { Transaction } from "@/types/transaction";
import { CiCircleQuestion } from "react-icons/ci";
import { parseError } from "@/utils/parseError";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { parseMinutes } from "@/utils/parseMinutes";

export default function TransactionSection() {
  const { pendingTransactions, completedTransactions } = useTransactions();
  const { avlHead, ethHead } = useLatestBlockInfo();
  const [paginatedTransactionArray, setPaginatedTransactionArray] = useState<
    Transaction[][]
  >([]);
  const [pendingTab, setPendingTab] = useState<boolean>(true);
  const [
    paginatedCompletedTransactionArray,
    setPaginatedCompletedTransactionArray,
  ] = useState<Transaction[][]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const { initClaimAvailToEth, initClaimEthtoAvail } = useClaim();
  const [complete, setComplete] = useState<boolean[]>(
    Array(pendingTransactions.length).fill(false)
  );
  const [inProcess, setInProcess] = useState<boolean[]>(
    Array(pendingTransactions.length).fill(false)
  );

  useEffect(() => {
    if (pendingTransactions && pendingTransactions.length > 0) {
      const chunkSize = 4;
      const chunks = [];
      const sortedTxns = pendingTransactions.sort((a, b) => {
        return (
          new Date(b.sourceTimestamp).getTime() -
          new Date(a.sourceTimestamp).getTime()
        );
      });
      for (let i = 0; i < pendingTransactions.length; i += chunkSize) {
        chunks.push(sortedTxns.slice(i, i + chunkSize));
      }
      setPaginatedTransactionArray(chunks);
    }
  }, [pendingTransactions]);

  useEffect(() => {
    if (completedTransactions && completedTransactions.length > 0) {
      const chunkSize = 4;
      const sortedTxns = completedTransactions.sort((a, b) => {
        return (
          new Date(b.sourceTimestamp).getTime() -
          new Date(a.sourceTimestamp).getTime()
        );
      });
      const chunks = [];
      for (let i = 0; i < completedTransactions.length; i += chunkSize) {
        chunks.push(sortedTxns.slice(i, i + chunkSize));
      }
      setPaginatedCompletedTransactionArray(chunks);
    }
  }, [completedTransactions]);

  useEffect(() => {
    setInProcess(Array(pendingTransactions.length).fill(false));
    setComplete(Array(pendingTransactions.length).fill(false));
  }, [pendingTransactions]);

  const onSubmit = async (
    chainFrom: Chain,
    blockhash: `0x${string}`,
    index: number,
    sourceTransactionHash: `0x${string}`,
    sourceTimestamp: string,
    atomicAmount: string,
    sourceTransactionIndex?: number,
    executeParams?: {
      messageid: number;
      amount: number;
      from: `${string}`;
      to: `${string}`;
      originDomain: number;
      destinationDomain: number;
    }
  ) => {
    setInProcess((prevState) =>
      prevState.map((state, idx) => (idx === index ? true : state))
    );

    try {
      if (
        chainFrom === Chain.AVAIL &&
        blockhash &&
        sourceTransactionIndex &&
        sourceTransactionHash
      ) {
        console.log("Initiate ReceiveAvail()");
        const successBlockhash = await initClaimAvailToEth({
          blockhash: blockhash,
          sourceTransactionIndex: sourceTransactionIndex,
          sourceTransactionHash: sourceTransactionHash,
          sourceTimestamp: sourceTimestamp,
          atomicAmount: atomicAmount,
        });
        if (successBlockhash) {
          showSuccessMessage({
            blockhash: successBlockhash,
            chain: Chain.ETH,
          });
          setComplete((prevState) =>
            prevState.map((state, idx) => (idx === index ? true : state))
          );
        }
      } else if (chainFrom === Chain.ETH && blockhash && executeParams) {
        console.log("Initiate Vector.Execute");
        const successBlockhash = await initClaimEthtoAvail({
          blockhash: blockhash,
          sourceTransactionHash: sourceTransactionHash,
          sourceTimestamp: sourceTimestamp,
          atomicAmount: atomicAmount,
          executeParams: executeParams,
        });
        if (successBlockhash.blockhash) {
          showSuccessMessage({
            blockhash: successBlockhash.blockhash,
            txHash: successBlockhash.txHash,
            chain: Chain.AVAIL,
          });
          setComplete((prevState) =>
            prevState.map((state, idx) => (idx === index ? true : state))
          );
          console.log("Claimed AVAIL on AVAIL");
          console.log(complete, "complete index", index);
        }
      } else {
        showFailedMessage({ title: "Invalid Transaction" });
      }
    } catch (e) {
      console.error(e);
      showFailedMessage({ title: parseError(e) });
    } finally {
      setInProcess((prevState) =>
        prevState.map((state, idx) => (idx === index ? false : state))
      );
    }
  };

  function SubmitClaim({ txn, index }: { txn: Transaction; index: number }) {
    return (
      <>
        <LoadingButton
          key={index}
          variant="primary"
          loading={inProcess[index]}
          className="!px-4 !py-0 rounded-xl whitespace-nowrap"
          onClick={async () => {
            await onSubmit(
              txn.sourceChain,
              //@ts-ignore to be fixed later
              txn.sourceBlockHash,
              index,
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
            )
          }}
        >
          {txn.status === "READY_TO_CLAIM" ? "Claim Ready" : txn.status}
        </LoadingButton>
      </>
    );
  }

  const getStatusTime = ({
    from,
    sourceTimestamp,
    sourceBlockNumber,
    status,
  }: {
    from: Chain;
    sourceTimestamp: Transaction["sourceTimestamp"];
    sourceBlockNumber: Transaction["sourceBlockNumber"];
    status: TransactionStatus;
  }) => {
    if (status === "READY_TO_CLAIM") {
      return "~";
    }
    if (status === "INITIATED") {
      return "Waiting for finalisation";
    }
    if (from === Chain.ETH) {
      const totalMinutes = (ethHead.timestamp - new Date(sourceTimestamp).getTime()) / 1000 / 60;

      return `~ Estimated time: ${parseMinutes(totalMinutes)}`;
    }

    if (from === Chain.AVAIL) {
      const estimatedTimeMinutes = (((avlHead.data.end + 360) - sourceBlockNumber) * 12) / 60 + 60;

      return `~ Estimated time: ${parseMinutes(estimatedTimeMinutes)}`;
    }
  };

  function ParsedDate({
    sourceTimestamp,
  }: {
    sourceTimestamp: string;
  }) {
    return (
      <span className="flex md:flex-col flex-row items-center justify-center mr-4  ">
        <span className="text-white text-opacity-60 flex md:flex-col flex-row space-x-1 items-center justify-center ml-2">
          <p className="text-white">
            {parseDateTimeToDay(sourceTimestamp)}
          </p>
          <p className=" text-xs">
            {parseDateTimeToMonthShort(sourceTimestamp)}
          </p>
        </span>
      </span>
    );
  }

  function TxnAddresses({
    depositor,
    receiver,
  }: {
    depositor: string;
    receiver: string;
  }) {
    return (
      <span className="cursor-pointer flex mt-2 text-white text-opacity-70 flex-row w-full text-sm underline">
        <HoverCard>
          <HoverCardTrigger>From</HoverCardTrigger>
          <HoverCardContent className="bg-[#141414]">
            <p className="text-white text-opacity-80 !font-thicccboisemibold flex flex-row">
              <span>Depositor Address</span>{" "}
              <img
                src="/images/Wallet.png"
                className="pl-1 !w-5 h-4"
                alt="wallet"
              ></img>
            </p>
            <p className="text-white text-opacity-70 overflow-scroll">
              {depositor}
            </p>
          </HoverCardContent>
        </HoverCard>
        <ArrowUpRight className="w-4 h-4 mr-2" />
        <HoverCard>
          <HoverCardTrigger className="">To </HoverCardTrigger>
          <HoverCardContent>
            <p className="text-white text-opacity-80 !font-thicccboisemibold flex flex-row ">
              <span>Reciever Address</span>{" "}
              <img
                src="/images/Wallet.png"
                className="pl-1 !w-5 h-4"
                alt="wallet"
              ></img>
            </p>
            <p className="text-white text-opacity-70 overflow-scroll">
              {receiver}
            </p>
          </HoverCardContent>
        </HoverCard>{" "}
        <ArrowDownLeft className="w-4 h-4" />
      </span>
    );
  }

  const showPagination = () => {
    if (paginatedCompletedTransactionArray.length > 4 && !pendingTab) {
      return true;
    }
    if (paginatedTransactionArray.length > 4 && pendingTab) {
      return true;
    }
    return false;
  };

  function PendingTransactions({
    pendingTransactions,
  }: {
    pendingTransactions: Transaction[];
  }) {
    return (
      <div className="flex h-[85%] overflow-y-scroll">
        <TableBody className="overflow-y-scroll min-w-[99%] mx-auto space-y-2.5">
          {pendingTransactions &&
            pendingTransactions.map((txn, index) => (
              <TableRow
                className="flex overflow-x-scroll flex-row justify-between w-[100%] bg-[#363b4f] rounded-xl "
                key={index}
              >
                <TableCell className="font-medium flex flex-row rounded-xl">
                  <div className="hidden md:flex">
                    <ParsedDate
                      sourceTimestamp={
                        txn.sourceTimestamp
                      }
                    />
                  </div>

                  <span className="flex flex-col-reverse items-start justify-center">
                    <TxnAddresses
                      depositor={txn.depositorAddress}
                      receiver={txn.receiverAddress}
                    />
                    <span className="flex flex-row w-full">
                      <ChainLabel chain={txn.sourceChain} />
                      <p className="md:px-4 px-2">
                        <MoveRight />
                      </p>{" "}
                      <ChainLabel chain={txn.sourceChain === Chain.AVAIL ? Chain.ETH : Chain.AVAIL} />
                      <div className="md:hidden flex">
                        <ParsedDate
                          sourceTimestamp={
                            txn.sourceTimestamp
                          }
                        />
                      </div>
                    </span>
                    <span className="flex flex-row space-x-2">
                      <p className="text-white !text-md lg:text-lg font-thicccboisemibold">
                        {
                          //@ts-ignore look at this once @ankitboghra
                          parseAvailAmount(txn.amount)
                        }{" "}
                        AVAIL
                      </p>
                      <a
                        target="_blank"
                        href={
                          txn.sourceChain === Chain.ETH
                            ? `${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL}/tx/${txn.sourceTransactionHash}`
                            : //TODO: need to fix this, the local txn dosen't have all these, check indexer to see how they are fetching.
                            `${process.env.NEXT_PUBLIC_SUBSCAN_URL}/extrinsic/${txn.sourceTransactionHash}`
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
                        <>
                          <SubmitClaim txn={txn} index={index} />
                        </>
                      ) : (
                        <>
                          <Badge className="flex-row items-center justify-center space-x-2 bg-[#24262f]">
                            <p className="font-thicccboisemibold whitespace-nowrap">
                              {txn.status === "BRIDGED"
                                ? `In Progress`
                                : txn.status.charAt(0) +
                                txn.status.toLocaleLowerCase().slice(1)}
                            </p>
                            <span className="relative flex h-2 w-2">
                              <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${txn.status === "INITIATED"
                                  ? "bg-yellow-600"
                                  : `${txn.status === "PENDING"
                                    ? "bg-blue-600"
                                    : "bg-orange-500"
                                  }`
                                  } opacity-75`}
                              ></span>
                              <span
                                className={`relative inline-flex rounded-full h-2 w-2  ${txn.status === "INITIATED"
                                  ? "bg-yellow-600"
                                  : `${txn.status === "PENDING"
                                    ? "bg-blue-600"
                                    : "bg-orange-500"
                                  }`
                                  }`}
                              ></span>
                            </span>
                          </Badge>
                        </>
                      )}
                    </span>
                    <p className="text-xs flex flex-row items-end justify-end text-right text-white text-opacity-70 space-x-1">
                      <span>{getStatusTime({ from: txn.sourceChain, sourceTimestamp: txn.sourceTimestamp, sourceBlockNumber: txn.sourceBlockNumber, status: txn.status })}</span>{" "}
                      <Clock className="w-4 h-4" />
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </div>
    );
  }

  function CompletedTransactions({
    completedTransactions,
  }: {
    completedTransactions: Transaction[];
  }) {
    return (
      <div className="flex h-[85%] overflow-y-scroll">
        <TableBody className="overflow-y-scroll min-w-[99%] mx-auto space-y-2.5">
          {completedTransactions &&
            completedTransactions.map((txn, index) => (
              <TableRow
                className="flex overflow-x-scroll flex-row justify-between w-[100%] bg-[#363b4f] rounded-xl "
                key={index}
              >
                <TableCell className="font-medium flex flex-row rounded-xl">
                  <div className="hidden md:flex">
                    <ParsedDate
                      sourceTimestamp={
                        txn.sourceTimestamp
                      }
                    />
                  </div>

                  <span className="flex flex-col-reverse items-start justify-center">
                    <TxnAddresses
                      depositor={txn.depositorAddress}
                      receiver={txn.receiverAddress}
                    />
                    <span className="flex flex-row w-full">
                      <ChainLabel chain={txn.sourceChain} />
                      <p className="md:px-4 px-2">
                        <MoveRight />
                      </p>{" "}
                      <ChainLabel chain={txn.sourceChain === Chain.AVAIL ? Chain.ETH : Chain.AVAIL} />
                      <div className="md:hidden flex">
                        <ParsedDate
                          sourceTimestamp={
                            txn.sourceTimestamp
                          }
                        />
                      </div>
                    </span>
                    <span className="flex flex-row space-x-2">
                      <p className="text-white !text-md lg:text-lg font-thicccboisemibold">
                        {
                          //@ts-ignore look at this once @ankitboghra
                          parseAvailAmount(txn.amount)
                        }{" "}
                        AVAIL
                      </p>
                      <a
                        target="_blank"
                        href={
                          txn.sourceChain === Chain.ETH
                            ? `${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL}/tx/${txn.sourceTransactionHash}`
                            : //TODO: need to fix this, the local txn dosen't have all these, check indexer to see how they are fetching.
                            `${process.env.NEXT_PUBLIC_SUBSCAN_URL}/extrinsic/${txn.sourceBlockNumber}-${txn.sourceTransactionIndex}`
                        }
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </span>
                  </span>

                  <br />
                </TableCell>
                <TableCell className="flex text-right items-center ">
                  <div className="flex flex-col space-y-2 justify-between">
                    <span>
                      <>
                        <Badge className="flex-row items-center justify-center space-x-2 bg-[#24262f]">
                          <p>
                            {txn.status === "CLAIMED"
                              ? "Bridged"
                              : txn.status.charAt(0) +
                              txn.status.toLocaleLowerCase().slice(1)}
                          </p>
                          <span className="relative flex h-2 w-2">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full  opacity-75`}
                            ></span>
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2 bg-green-600`}
                            ></span>
                          </span>
                        </Badge>
                      </>
                    </span>
                    <p className="text-xs flex flex-row items-end justify-end text-right text-white text-opacity-70 space-x-1">
                      <a
                        target="_blank"
                        href={
                          txn.sourceChain === Chain.AVAIL
                            ? `${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL}/tx/${txn.destinationTransactionHash}`
                            : `${process.env.NEXT_PUBLIC_SUBSCAN_URL}/extrinsic/${txn.destinationTransactionHash}`
                        }
                        className="flex flex-row !text-xs justify-end text-white text-opacity-75 underline"
                      >
                        Claim Transaction <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </div>
    );
  }

  function NoTransactions() {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 !h-[100%]">
        <img
          src="/images/notransactions.svg"
          alt="no transactions"
          className="text-opacity-80"
        ></img>
        <h2 className="font-ppmoribsemibold text-center w-[70%] md:text-lg mx-auto text-white text-opacity-90">
          You don&apos;t have any transactions
          <br /> with the connected accounts
        </h2>
      </div>
    );
  }

  return (
    <div className=" relative flex flex-col mx-auto w-[95%] h-[100%] ">
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
          >
            <p>History</p>
            <FaHistory />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="h-full">
          <div className=" h-full">
            {pendingTransactions.length > 0 ? (
              <PendingTransactions
                pendingTransactions={paginatedTransactionArray[currentPage]}
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
                  paginatedCompletedTransactionArray[currentPage]
                }
              />
            ) : (
              <NoTransactions />
            )}
          </div>
        </TabsContent>
      </Tabs>
      {/* Pagination */}
      {showPagination() ? (
        <div className="absolute w-[102%] pt-4 mx-auto bottom-3 -right-0 flex flex-row space-x-2 items-center justify-end bg-[#2B3042]">
          <p className="font-thicccboisemibold text-sm text-white mr-2">
            <HoverCard>
              <HoverCardTrigger className="cursor-pointer">
                <CiCircleQuestion className="w-6 h-6" />
              </HoverCardTrigger>
              <HoverCardContent className="font-thicccboisemibold text-white text-opacity-70">
                Transactions take about 1 hour to bridge, thank you for your
                patience.
              </HoverCardContent>
            </HoverCard>
          </p>
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className={`rounded-lg bg-[#484C5D] ${currentPage === 0
              ? "cursor-not-allowed bg-opacity-30 text-opacity-40  text-white "
              : " text-white"
              } p-2`}
          >
            <ArrowLeft />
          </button>
          <button
            disabled={currentPage === paginatedTransactionArray.length - 1}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className={`rounded-lg bg-[#484C5D] ${currentPage === paginatedTransactionArray.length - 1
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
    </div>
  );
}
