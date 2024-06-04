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
import { useAvailAccount } from "@/stores/availWalletHook";
import { Transaction } from "@/types/transaction";
import { CiCircleQuestion } from "react-icons/ci";
import { parseError } from "@/utils/parseError";

export default function TransactionSection() {
  const { pendingTransactions, completedTransactions } = useTransactions();
  const [paginatedTransactionArray, setPaginatedTransactionArray] = useState<
    Transaction[][]
  >([]);
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
          new Date(b.sourceTransactionTimestamp).getTime() -
          new Date(a.sourceTransactionTimestamp).getTime()
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
          new Date(b.sourceTransactionTimestamp).getTime() -
          new Date(a.sourceTransactionTimestamp).getTime()
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
    sourceTransactionTimestamp: string,
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
          sourceTransactionTimestamp: sourceTransactionTimestamp,
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
          sourceTransactionTimestamp: sourceTransactionTimestamp,
          atomicAmount: atomicAmount,
          executeParams: executeParams,
        });
        if (successBlockhash.blockhash) {
          showSuccessMessage({
            blockhash: successBlockhash.blockhash,
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
          className="!px-4 !py-0 rounded-xl"
          onClick={() =>
            onSubmit(
              txn.sourceChain,
              //@ts-ignore to be fixed later
              txn.sourceBlockHash,
              index,
              txn.sourceTransactionHash,
              txn.sourceTransactionTimestamp,
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
          }
        >
          {txn.status === "READY_TO_CLAIM" ? "Claim Ready" : txn.status}
        </LoadingButton>
      </>
    );
  }

  const getStatusTime = (status: TransactionStatus) => {
    switch (status) {
      case "PENDING":
        return "~10 minutes approx";
      case "INITIATED":
        return "~1 hour approx";
      case "BRIDGED":
        return "~45 minutes approx";
      default:
        return "--";
    }
  };

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
          <HoverCardTrigger>Depositor</HoverCardTrigger>
          <HoverCardContent className="bg-[#141414]">
            <p className="text-white text-opacity-80 !font-thicccboisemibold flex flex-row">
              <span>Depositor Address</span>{" "}
              <img src="/images/Wallet.png" className="pl-1 !w-5 h-4"></img>
            </p>
            <p className="text-white text-opacity-70 overflow-scroll">
              {depositor}
            </p>
          </HoverCardContent>
        </HoverCard>{" "}
        <ArrowUpRight className="w-4 h-4 mr-2" />
        <HoverCard>
          <HoverCardTrigger className="">Reciever </HoverCardTrigger>
          <HoverCardContent>
            <p className="text-white text-opacity-80 !font-thicccboisemibold flex flex-row ">
              <span>Reciever Address</span>{" "}
              <img src="/images/Wallet.png" className="pl-1 !w-5 h-4"></img>
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

  function PendingTransactions({
    pendingTransactions,
  }: {
    pendingTransactions: Transaction[];
  }) {
    return (
      <div className="flex h-[100%] overflow-scroll">
        <TableBody className="overflow-scroll min-w-[99%] mx-auto space-y-2.5">
          {pendingTransactions && 
            pendingTransactions.map((txn, index) => (
              <TableRow
                className="flex flex-row justify-between w-[100%] bg-[#363b4f] rounded-xl "
                key={index}
              >
                <TableCell className="font-medium flex flex-row space-x-4 rounded-xl">
                  <span className="flex flex-col items-center justify-center  ">
                    <span className="text-white text-opacity-60 flex flex-col items-center justify-center ml-2">
                      <p className="text-white text-md">
                        {parseDateTimeToDay(txn.sourceTransactionTimestamp)}
                      </p>
                      <p className=" text-xs">
                        {parseDateTimeToMonthShort(
                          txn.sourceTransactionTimestamp
                        )}
                      </p>
                    </span>
                  </span>
                  <span className="flex flex-col-reverse items-start justify-center">
                    <TxnAddresses
                      depositor={txn.depositorAddress}
                      receiver={txn.receiverAddress}
                    />
                    <span className="flex flex-row w-full">
                      <ChainLabel chain={txn.sourceChain} />
                      <p className="px-4">
                        <MoveRight />
                      </p>{" "}
                      <ChainLabel chain={txn.destinationChain} />
                    </span>

                    <span className="flex flex-row space-x-2">
                      <p className="text-white  text-lg font-thicccboisemibold">
                        Sent{" "}
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
                            ? `https://sepolia.etherscan.io/tx/${txn.sourceTransactionHash}`
                            : //TODO: need to fix this, the local txn dosen't have all these, check indexer to see how they are fetching.
                              `https://avail-turing.subscan.io/extrinsic/${txn.sourceTransactionBlockNumber}-${txn.sourceTransactionIndex}`
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
                            <p>
                              {txn.status === "BRIDGED"
                                ? "In Progress"
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
                        </>
                      )}
                    </span>
                    <p className="text-xs flex flex-row items-end justify-end text-right text-white text-opacity-70 space-x-1">
                      <span>{getStatusTime(txn.status)}</span>{" "}
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
      <div className="flex">
        <TableBody className="min-w-[99%] mx-auto space-y-2.5">
          {completedTransactions &&
            completedTransactions.map((txn, index) => (
              <TableRow
                className="flex flex-row justify-between w-[100%] bg-[#363b4f] rounded-xl "
                key={index}
              >
                <TableCell className="font-medium flex flex-row space-x-4 rounded-xl">
                  <span className="flex flex-col items-center justify-center  ">
                    <span className="text-white text-opacity-60 flex flex-col items-center justify-center ml-2">
                      <p className="text-white text-md">
                        {parseDateTimeToDay(txn.sourceTransactionTimestamp)}
                      </p>
                      <p className=" text-xs">
                        {parseDateTimeToMonthShort(
                          txn.sourceTransactionTimestamp
                        )}
                      </p>
                    </span>
                  </span>
                  <span className="flex flex-col-reverse items-start justify-center">
                  <TxnAddresses
                      depositor={txn.depositorAddress}
                      receiver={txn.receiverAddress}
                    />
                    <span className="flex flex-row w-full">
                      <ChainLabel chain={txn.sourceChain} />
                      <p className="px-4">
                        <MoveRight />
                      </p>{" "}
                      <ChainLabel chain={txn.destinationChain} />
                    </span>

                    <span className="flex flex-row space-x-2">
                      <p className="text-white  text-lg font-thicccboisemibold">
                        Sent{" "}
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
                            ? `https://sepolia.etherscan.io/tx/${txn.sourceTransactionHash}`
                            : `https://avail-turing.subscan.io/extrinsic/${txn.sourceTransactionBlockNumber}-${txn.sourceTransactionIndex}`
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
                            ? `https://sepolia.etherscan.io/tx/${txn.destinationTransactionHash}`
                            : `https://avail-turing.subscan.io/extrinsic/${txn.destinationTransactionHash}`
                        }
                        className="flex flex-row !text-xs justify-end text-white text-opacity-75 underline"
                      >
                        Destination Transaction{" "}
                        <ArrowUpRight className="w-4 h-4" />
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
    <div className=" relative flex flex-col mx-auto w-[95%] h-full ">
    <Tabs
      defaultValue="pending"
      className="flex flex-col h-full"
    >
      <TabsList className="grid w-full grid-cols-2 !bg-[#33384B] !border-0 mb-2  ">
        <TabsTrigger value="pending" className="">
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
        <div className="overflow-y-scroll h-full">
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
        <div className="overflow-y-scroll h-full  min-w-[100%]">
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
    <div className="absolute w-[102%] pt-4 mx-auto bottom-1 -right-2 flex flex-row space-x-2 items-center justify-end bg-[#2B3042]">
        <p className="font-thicccboisemibold text-sm text-white mr-2">
        
          <HoverCard>
  <HoverCardTrigger className="cursor-pointer">  <CiCircleQuestion className="w-6 h-6" /></HoverCardTrigger>
  <HoverCardContent className="font-thicccboisemibold text-white text-opacity-70">
    Transactions take about 1 hour to bridge, thank you for your patience.  </HoverCardContent>
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
          disabled={currentPage === paginatedTransactionArray.length - 1}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className={`rounded-lg bg-[#484C5D] ${
            currentPage === paginatedTransactionArray.length - 1
              ? "cursor-not-allowed bg-opacity-30 text-opacity-40  text-white "
              : " text-white"
          } p-2`}
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
