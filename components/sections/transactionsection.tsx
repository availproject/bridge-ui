
"use client";

import { FaHistory } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Chain } from "@/types/common";
import useTransactions from "@/hooks/useTransactions";
import { parseAvailAmount } from "@/utils/parseAmount";
import { ChainLabel } from "../ui/chainLabel";
import {
  parseDateTimeToMonthShort,
  parseDateTimeToDay,
} from "@/utils/parseDateTime";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  MoveRight,
} from "lucide-react";
import useClaim from "@/hooks/useClaim";
import { useEffect, useState } from "react";
import { showFailedMessage, showSuccessMessage } from "@/utils/common";
import { LoadingButton } from "../ui/loadingbutton";
import { useAvailAccount } from "@/stores/availWalletHook";
import { pollWithDelay } from "@/utils/poller";
import { appConfig } from "@/config/default";
import { Transaction } from "@/types/transaction";

export default function TransactionSection() {
    const { pendingTransactions, completedTransactions } = useTransactions();
    const [paginatedTransactionArray, setPaginatedTransactionArray] = useState<Transaction[][]>([]);
    const [paginatedCompletedTransactionArray, setPaginatedCompletedTransactionArray] = useState<Transaction[][]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const { selected } = useAvailAccount();
    const { fetchTransactions } = useTransactions();
    const { initClaimAvailToEth, initClaimEthtoAvail } = useClaim();
    const [complete, setComplete] = useState<boolean[]>(
      Array(pendingTransactions.length).fill(false),
    );
    const [inProcess, setInProcess] = useState<boolean[]>(
      Array(pendingTransactions.length).fill(false),
    );
  
    const appInit = async () => {
      if (!selected) return;
      pollWithDelay(
        fetchTransactions,
        [
          {
            userAddress: selected.address,
          },
        ],
        appConfig.bridgeIndexerPollingInterval,
        () => true,
      );
    };
  
    useEffect(() => {
      if (pendingTransactions && pendingTransactions.length > 0) {
        const chunkSize = 4;
        const chunks = [];
        for (let i = 0; i < pendingTransactions.length; i += chunkSize) {
          chunks.push(pendingTransactions.slice(i, i + chunkSize));
        }
        setPaginatedTransactionArray(chunks);
      }
    },[pendingTransactions])
  
    useEffect(() => {
      if (completedTransactions && completedTransactions.length > 0) {
        const chunkSize = 4;
        const chunks = [];
        for (let i = 0; i < completedTransactions.length; i += chunkSize) {
          chunks.push(completedTransactions.slice(i, i + chunkSize));
        }
        setPaginatedCompletedTransactionArray(chunks);
      }
    },[completedTransactions])
  
    useEffect(() => {
      appInit();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);
  
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
      },
    ) => {
      setInProcess((prevState) =>
        prevState.map((state, idx) => (idx === index ? true : state)),
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
              prevState.map((state, idx) => (idx === index ? true : state)),
            );
            console.log("Claimed AVAIL");
            console.log(complete, "complete index", index);
          } else {
            showFailedMessage();
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
              prevState.map((state, idx) => (idx === index ? true : state)),
            );
            console.log("Claimed AVAIL on AVAIL");
            console.log(complete, "complete index", index);
          } else {
            showFailedMessage();
          }
  
          setComplete((prevState) =>
            prevState.map((state, idx) => (idx === index ? true : state)),
          );
          console.log("Claimed AVAIL on ETH");
        } else {
          showFailedMessage();
        }
      } catch (e) {
        console.error(e);
        showFailedMessage();
      } finally {
        setInProcess((prevState) =>
          prevState.map((state, idx) => (idx === index ? false : state)),
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
            className="!px-4 !py-0"
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
                },
              )
            }
          >
            {txn.status === "READY_TO_CLAIM" ? "Claim" : txn.status}
          </LoadingButton>
        </>
      );
    }
  
    function PendingTransactions({
      pendingTransactions,
    }: {
      pendingTransactions: Transaction[];
    }) {
      return (
        <div className="flex">
          <TableBody className="min-w-[100%]" >
            {pendingTransactions
              ?.sort((a, b) => {
                return (
                  new Date(b.sourceTransactionTimestamp).getTime() -
                  new Date(a.sourceTransactionTimestamp).getTime()
                );
              })
              .map((txn, index) => (
                <TableRow className="flex flex-row justify-between w-[100%] " key={index}>
                  <TableCell className="font-medium flex flex-row space-x-2">
                    <span className="flex flex-col">
                      <span className="text-white text-opacity-60 flex flex-col items-center justify-center">
                        <p className="text-white text-md">
                          {parseDateTimeToDay(txn.sourceTransactionTimestamp)}
                        </p>
                        <p>
                          {parseDateTimeToMonthShort(
                            txn.sourceTransactionTimestamp,
                          )}
                        </p>
                      </span>
                    </span>
                    <span className="flex flex-col space-y-1 ">
                      <span className="flex flex-row w-full">
                        <ChainLabel chain={txn.sourceChain} />
                        <p className="px-1">
                          <MoveRight />
                        </p>{" "}
                        <ChainLabel chain={txn.destinationChain} />
                      </span>
  
                      <span className="flex flex-row space-x-2">
                        <p className="text-white text-opacity-60 text-xs ml-2">
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
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </span>
                    </span>
  
                    <br />
                  </TableCell>
                  <TableCell className="text-right items-end">
                    {txn.status === "READY_TO_CLAIM" ? (
                      <>
                        <SubmitClaim txn={txn} index={index} />
                      </>
                    ) : (
                      <>
                        <Badge className="flex-row items-center justify-center space-x-2">
                          <p>{txn.status}</p>
                          <span className="relative flex h-2 w-2">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                                txn.status === "SUBMITTED"
                                  ? "bg-yellow-600"
                                  : "bg-green-600"
                              } opacity-75`}
                            ></span>
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2  ${
                                txn.status === "SUBMITTED"
                                  ? "bg-yellow-600"
                                  : "bg-green-600"
                              }`}
                            ></span>
                          </span>
                        </Badge>
                      </>
                    )}
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
          <TableBody className="min-w-[100%]" >
            {completedTransactions?.map((txn, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium w-full flex flex-row space-x-2">
                  <span className="flex flex-col">
                    <span className="text-white text-opacity-60 flex flex-col items-center justify-center">
                      <p className="text-white text-md">
                        {parseDateTimeToDay(txn.sourceTransactionTimestamp)}
                      </p>
                      <p>
                        {parseDateTimeToMonthShort(
                          txn.sourceTransactionTimestamp,
                        )}
                      </p>
                    </span>
                    {/* <p className="text-white text-opacity-60">{` ${new Date(
                          txn.sourceTransactionTimestamp
                        ).getHours()}${new Date(
                          txn.sourceTransactionTimestamp
                        ).getMinutes()}`}</p> */}
                  </span>
                  <span className="flex flex-col space-y-1 ">
                    <span className="flex flex-row w-full">
                      <ChainLabel chain={txn.sourceChain} />
                      <p className="px-1">
                        <MoveRight />
                      </p>{" "}
                      <ChainLabel chain={txn.destinationChain} />
                    </span>
  
                    <span className="flex flex-row space-x-2">
                      <p className="text-white text-opacity-60 text-xs ml-2">
                        {
                          //@ts-ignore look at this once @ankitboghra
                          parseAvailAmount(txn.amount)
                        }{" "}
                        AVAIL
                      </p>
                    </span>
                  </span>
                  <br />
                </TableCell>
                <TableCell className="text-right  items-end">
                  <a
                    target="_blank"
                    href={
                      txn.sourceChain === Chain.AVAIL
                        ? `https://sepolia.etherscan.io/tx/${txn.destinationTransactionHash}`
                        : `https://avail-turing.subscan.io/extrinsic/${txn.destinationTransactionHash}`
                    }
                    className="flex flex-row !text-xs justify-end text-white text-opacity-75"
                  >
                    View on Explorer <ArrowUpRight className="w-4 h-4" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </div>
      );
    }
  
    function NoTransactions() {
      return (
        <>
          <div className="flex pt-[30%] md:pt-[25%] lg:pt-[20%] xl:pt-[15%] flex-col items-center justify-center space-y-4">
            <img
              src="/images/notransactions.svg"
              alt="no transactions"
              className="text-opacity-80"
            ></img>
            <h2 className="font-ppmoribsemibold text-center w-[70%] md:text-lg mx-auto text-white text-opacity-90">
              You don&apos;t have any transactions<br/> with the connected accounts
            </h2>
          </div>
        </>
      );
    }
  
    return(
        <Tabs defaultValue="pending" className="relative flex flex-col  mx-auto mt-2 w-[100%] h-[100%] ">
        <TabsList className="grid w-full grid-cols-2 !bg-[#33384B] !border-0 mb-4 ">
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
        <TabsContent value="pending">
          <div className="overflow-y-scroll min-w-[100%]">
          {
            pendingTransactions.length > 0 ? (

              <PendingTransactions pendingTransactions={paginatedTransactionArray[currentPage]}  />
            ) : (
              <NoTransactions />
            )
        }
          </div>
        </TabsContent>
        <TabsContent value="history">
          <div className="overflow-y-scroll">
          {completedTransactions.length > 0 ? (
            <CompletedTransactions completedTransactions={paginatedCompletedTransactionArray[currentPage]} />
          ) : (
            <NoTransactions />
          )}
          </div>
         
        </TabsContent>
    <div className="absolute bottom-5 right-3 flex flex-row space-x-2 items-center justify-center">
        <p className="font-thicccboisemibold text-sm text-white mr-4">View More</p>
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className={`rounded-lg bg-[#484C5D] ${currentPage === 0 ? 'cursor-not-allowed bg-opacity-30 text-opacity-40  text-white ' :" text-white"} p-2`}
                  ><ArrowLeft/></button>
                  <button
                    disabled={currentPage === paginatedTransactionArray.length - 1}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className={`rounded-lg bg-[#484C5D] ${currentPage === paginatedTransactionArray.length - 1 ? 'cursor-not-allowed bg-opacity-30 text-opacity-40  text-white ' :" text-white"} p-2`}
                  ><ArrowRight/></button>
              </div>
      </Tabs>
    );
}