/* eslint-disable @next/next/no-img-element */

"use client";

import { FaCheckCircle, FaHistory } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { TableBody, TableCell, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Chain, TransactionStatus } from "@/types/common";
import useTransactions from "@/hooks/useTransactions";
import { parseAmount, parseAvailAmount } from "@/utils/parseAmount";
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
import { _getBalance, showFailedMessage, showSuccessMessage } from "@/utils/common";
import { LoadingButton } from "../ui/loadingbutton";
import { Transaction } from "@/types/transaction";
import { CiCircleQuestion } from "react-icons/ci";
import { parseError } from "@/utils/parseError";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { parseMinutes } from "@/utils/parseMinutes";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import Link from "next/link";
import { set } from "zod";
import { RiLoopLeftFill } from "react-icons/ri";

export default function TransactionSection() {
  const { pendingTransactions, completedTransactions } = useTransactions();
  const { avlHead, ethHead } = useLatestBlockInfo();
  const [paginatedTransactionArray, setPaginatedTransactionArray] = useState<
    Transaction[][]
  >([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
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
  const [availToEthHash, setAvailToEthHash] = useState<string>("");
  const [ethToAvailHash, setEthToAvailHash] = useState<string>("");
  const [showPagination, setShowPagination] = useState<boolean>(false);

  //In milliseconds - 20 minutes.
  const TELEPATHY_INTERVAL = 1200000;
  //In milliseconds - 120 minutes.
  const VECTORX_INTERVAL = 7200000;

  useEffect(() => {
    if (pendingTransactions && pendingTransactions.length > 0) {
      const chunkSize = 3;
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
    setCurrentPage(0);
  }, [pendingTab]);

  useEffect(() => {
    if (completedTransactions && completedTransactions.length > 0) {
      const chunkSize = 3;
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
          setAvailToEthHash(successBlockhash);
          setOpenDialog(true);
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
        if (successBlockhash.txHash) {
          setEthToAvailHash(successBlockhash.txHash);
          setOpenDialog(true);
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

    //TODO: Change below to more accurate time
    if (status === "PENDING" && from === Chain.ETH) {
      return "Est time remaining: ~15 minutes";
    }

    //TODO: Change below to more accurate time
    if (status === "PENDING" && from === Chain.AVAIL) {
      return "Est time remaining: ~5 minutes";
    }

    if (from === Chain.ETH) {
      //Ethereum timestamp is in seconds, converting to ms here. 
      const lastProofTimestamp = ethHead.timestamp * 1000;
      const nextProofTimestamp = lastProofTimestamp + TELEPATHY_INTERVAL;
      const timeNow = Date.now();
      const timeLeft = nextProofTimestamp - timeNow;

      if (timeLeft < 0) {
        return `Est time remaining: Soon`
      }

      return `Est time remaining: ~${parseMinutes(timeLeft / 1000 / 60)}`;
    }

    if (from === Chain.AVAIL) {
      const lastProofTimestamp = avlHead.data.endTimestamp;
      const nextProofTimestamp = lastProofTimestamp + VECTORX_INTERVAL;
      const timeNow = Date.now();
      const timeLeft = nextProofTimestamp - timeNow;

      if (timeLeft < 0) {
        return `Est time remaining: Soon`
      }

      return `Est time remaining: ~${parseMinutes(timeLeft / 1000 / 60)}`;
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
    fromChain,
  }: {
    depositor: string;
    receiver: string;
    fromChain: Chain;
  }) {

    const [balance, setBalance] = useState<string | undefined>();

    useEffect(() => {
      const fetchBalance = async () => {
        const balance = fromChain === Chain.ETH 
          ? await _getBalance(Chain.AVAIL, receiver)
          : await _getBalance(Chain.ETH, undefined, receiver as `0x${string}`);
        setBalance(balance);
      };
  
      fetchBalance();
    }, [fromChain, receiver]);

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
            {fromChain === Chain.ETH && <p className="text-white text-opacity-70 overflow-scroll flex flex-row space-x-2">
         balance: {balance ? (
                    parseFloat(parseAmount(balance, 18)).toFixed(2) + " AVAIL"
                  ) : (
                    <RiLoopLeftFill
                      className={`h-4 w-4 ml-2 animate-spin font-bold`}
                    />
                  )}
            </p> }
          </HoverCardContent>
        </HoverCard>{" "}
        <ArrowDownLeft className="w-4 h-4" />
      </span>
    );
  }

  useEffect(() => {
    const showPagination = () => {
      if (paginatedCompletedTransactionArray.length > 1 && !pendingTab) {
        return setShowPagination(true);
      }
      if (paginatedTransactionArray.length > 1 && pendingTab) {
        return setShowPagination(true);
      }
      return setShowPagination(false);
    };
    showPagination();
  }, [paginatedCompletedTransactionArray, paginatedTransactionArray, pendingTab]);

  function PendingTransactions({
    pendingTransactions,
    openDialog,
    setOpenDialog,
    availToEthHash,
    ethToAvailHash,
  }: {
    pendingTransactions: Transaction[];
    openDialog: boolean;
    setOpenDialog: (value: boolean) => void;
    availToEthHash: string;
    ethToAvailHash: string;
  }) {

    return (
      <div className="flex h-[85%] mb-3">
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
                      fromChain={txn.sourceChain}
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
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogContent className="sm:max-w-md bg-[#252831] !border-0">
                    <DialogHeader>
                      <DialogTitle className="font-thicccboisemibold text-white text-2xl mb-2">
                        Claim Submitted
                      </DialogTitle>
                      <div className="border-b border border-white border-opacity-20"></div>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center !space-x-3 mt-2  ">
                      <div className="w-[100%] h-40 mx-auto rounded-xl bg-black flex flex-col items-center justify-center">
                        <FaCheckCircle
                          className="mr-4 h-10 w-10"
                          color="0BDA51"
                        />
                      </div>

                      <div className="flex flex-col space-y-2 ">
                        <p className="font-ppmori text-white text-sm text-opacity-60 mt-4">
                          Your{" "}
                          <span className="text-white ">
                            claim transaction
                          </span>{" "}
                          was successfully submitted to the chain. Your funds will be deposited to the destination account, generally
                          within
                          <span className="text-white italics"> ~15-30 minutes.</span>{" "}
                          <br />
                          <span>You can close this tab in the meantime, or initiate
                            another transfer.</span>
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="sm:justify-start mt-1">
                      <DialogClose asChild>
                        <Link target="_blank" href={
                          //TODO: this is erroring out sometimes, have a look.
                          txn.sourceChain === Chain.AVAIL
                            ? `${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL}/tx/${availToEthHash}`
                            : `${process.env.NEXT_PUBLIC_SUBSCAN_URL}/extrinsic/${ethToAvailHash}`
                        } className="w-full !border-0">
                          <Button
                            type="button"
                            variant="primary"

                            className="w-full !border-0"
                          >
                            View on Explorer <ArrowUpRight className="h-3 w-6" />
                          </Button>
                        </Link>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
      <div className="flex h-[85%] mb-3">
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
                      fromChain={txn.sourceChain}
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
      <div className="flex flex-col items-center justify-center space-y-4 !h-[100%] py-[10vh]">
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
                pendingTransactions={paginatedTransactionArray[currentPage]}
                openDialog={openDialog}
                setOpenDialog={setOpenDialog}
                availToEthHash={availToEthHash}
                ethToAvailHash={ethToAvailHash}
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
      {showPagination ? (
        <div className=" w-[100%] pt-4 mx-auto bottom-3 -right-0 flex flex-row space-x-2 items-center justify-end ">
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
            className={`rounded-lg bg-[#484C5D] ${currentPage === 0
              ? "cursor-not-allowed bg-opacity-30 text-opacity-40  text-white "
              : " text-white"
              } p-2`}
          >
            <ArrowLeft />
          </button>
          <button
            disabled={pendingTab ? currentPage === paginatedTransactionArray.length - 1 : currentPage === paginatedCompletedTransactionArray.length - 1}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className={`rounded-lg bg-[#484C5D] ${pendingTab ? currentPage === paginatedTransactionArray.length - 1 : currentPage === paginatedCompletedTransactionArray.length - 1
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