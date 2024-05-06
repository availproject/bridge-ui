"use client";

/* eslint-disable @next/next/no-img-element */
import { Table, TableBody, TableCell, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { Chain, TransactionStatus } from "@/types/common";
import useTransactions from "@/hooks/useTransactions";
import { parseAvailAmount } from "@/utils/parseAmount";
import { ChainLabel } from "../ui/chainLabel";
import {
  parseDateTimeToMonthShort,
  parseDateTimeToDay,
} from "@/utils/parseDateTime";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  ExternalLink,
  MoveRight,
} from "lucide-react";
import useClaim from "@/hooks/useClaim";
import { executeTransaction } from "@/services/vectorpallet";
import { useCommonStore } from "@/stores/common";
import { useEffect, useState } from "react";
import { showFailedMessage, showSuccessMessage } from "@/utils/common";
import { LoadingButton } from "../ui/loadingbutton";
import { useAvailAccount } from "@/stores/availWalletHook";
import { pollWithDelay } from "@/utils/poller";
import { appConfig } from "@/config/default";

export default function LatestTransactions(props: { pending: boolean }) {
  const { pendingTransactions, completedTransactions } = useTransactions();
  const { initClaimAvailToEth, initClaimEthtoAvail } = useClaim();
  const [inProcess, setInProcess] = useState<boolean[]>(
    Array(pendingTransactions.length).fill(false)
  );
  const { selected } = useAvailAccount();
  const { fetchTransactions, addToLocalTransaction } = useTransactions();

  const appInit = async () => {
    if (!selected) return;

    // Fetch all transactions
    // and keep polling
    pollWithDelay(
      fetchTransactions,
      [
        {
          userAddress: selected.address,
        },
      ],
      appConfig.bridgeIndexerPollingInterval,
      () => true
    );
  };

  useEffect(() => {
    appInit();
  }, [selected]);

  useEffect(() => {
    setInProcess(Array(pendingTransactions.length).fill(false));
  }, [pendingTransactions]);

  const onSubmit = async (
    chainFrom: Chain,
    blockhash: `0x${string}`,
    loadingIndex: number,
    index?: number,
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
      prevState.map((state, idx) => (idx === loadingIndex ? true : state))
    );

    try {
      if (chainFrom === Chain.AVAIL && blockhash && index) {
        console.log("Initiate ReceiveAvail()");
        const successBlockhash = await initClaimAvailToEth({
          blockhash: blockhash,
          index: index,
        });

        if (successBlockhash) {
          showSuccessMessage(successBlockhash);
        } else {
          showFailedMessage();
        }
      } else if (chainFrom === Chain.ETH && blockhash && executeParams) {
        console.log("Initiate Vector.Execute");
        await initClaimEthtoAvail({
          blockhash: blockhash,
          executeParams: executeParams,
        });
      } else {
        throw new Error("Invalid chain");
      }
    } catch (e) {
      console.error(e);
      showFailedMessage();
    } finally {
      setInProcess((prevState) =>
        prevState.map((state, idx) => (idx === loadingIndex ? false : state))
      );
    }
  };

  function PendingTransactions() {
    return (
      <>
        <TableBody>
          {pendingTransactions.sort((a, b) => {
    return new Date(b.sourceTransactionTimestamp).getTime() - new Date(a.sourceTransactionTimestamp).getTime(); }).map((txn, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium w-full flex flex-row space-x-2">
                <p className="flex flex-col">
                  <p className="text-white text-opacity-60 flex flex-col items-center justify-center">
                    <p className="text-white text-md">
                      {parseDateTimeToDay(txn.sourceTransactionTimestamp)}
                    </p>
                    <p>
                      {parseDateTimeToMonthShort(
                        txn.sourceTransactionTimestamp
                      )}
                    </p>
                  </p>
                </p>
                <p className="flex flex-col space-y-1 ">
                  <p className="flex flex-row w-full">
                    <ChainLabel chain={txn.sourceChain} />
                    <p className="px-1">
                    <MoveRight />
                    </p>{" "}
                    <ChainLabel chain={txn.destinationChain} />
                  </p>

                  <p className="flex flex-row space-x-2">
                    <p className="text-white text-opacity-60 text-xs ml-2">
                      {
                        //@ts-ignore look at this once @ankitboghra
                        parseAvailAmount(txn.amount)
                      }{" "}
                      AVAIL 
                    </p>
                    <a href={txn.sourceChain === Chain.ETH ? `https://sepolia.etherscan.io/tx/${txn.sourceBlockHash}` : `https://explorer.avail.so/#/explorer/query/${txn.sourceBlockHash}`}>
                      <ExternalLink className="w-3 h-3" />
                      </a>
                  </p>
                </p>

                <br />
              </TableCell>
              <TableCell className="text-right items-end">
                {txn.status === "READY_TO_CLAIM" ? (
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
                          1,
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
                      {txn.status === "READY_TO_CLAIM" ? "CLAIM" : txn.status}
                    </LoadingButton>
                  </>
                ) : (
                  <>
                    <Badge className=" flex flex-row items-center justify-center space-x-2">
                      <p>{txn.status}</p>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                      </span>
                    </Badge>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </>
    );
  }

  function CompletedTransactions() {
    return (
      <>
        <TableBody>
          {completedTransactions.map((txn, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium w-full flex flex-row space-x-2">
                <p className="flex flex-col">
                  <p className="text-white text-opacity-60 flex flex-col items-center justify-center">
                    <p className="text-white text-md">
                      {parseDateTimeToDay(txn.sourceTransactionTimestamp)}
                    </p>
                    <p>
                      {parseDateTimeToMonthShort(
                        txn.sourceTransactionTimestamp
                      )}
                    </p>
                  </p>
                  {/* <p className="text-white text-opacity-60">{` ${new Date(
                        txn.sourceTransactionTimestamp
                      ).getHours()}${new Date(
                        txn.sourceTransactionTimestamp
                      ).getMinutes()}`}</p> */}
                </p>
                <p className="flex flex-col space-y-1 ">
                  <p className="flex flex-row w-full">
                    <ChainLabel chain={txn.sourceChain} />
                    <p className="px-1">
                    <MoveRight />
                    </p>{" "}
                    <ChainLabel chain={txn.destinationChain} />
                  </p>

                  <p className="flex flex-row space-x-2">
                    <p className="text-white text-opacity-60 text-xs ml-2">
                      {
                        //@ts-ignore look at this once @ankitboghra
                        parseAvailAmount(txn.amount)
                      }{" "}
                      AVAIL
                    </p>
                  </p>
                </p>
                <br />
              </TableCell>
              <TableCell className="text-right  items-end">
                <a
                    href={txn.sourceChain === Chain.ETH ? `https://sepolia.etherscan.io/tx/${txn.sourceBlockHash}` : `https://explorer.avail.so/#/explorer/query/${txn.sourceBlockHash}`} className="flex flex-row !text-xs justify-end text-white text-opacity-75">
                  View on Explorer{" "}
                
                    <ArrowUpRight className="w-4 h-4" />
                  
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </>
    );
  }

  function NoTransactions() {
    return (
      <>
        <div className="flex flex-col items-center justify-center !h-[35vh] space-y-4">
          <img
            src="/images/notransactions.svg"
            alt="no transactions"
            className="text-opacity-80"
          ></img>
          <h2 className="font-ppmoribsemibold text-center w-[70%] mx-auto text-white text-opacity-90">
            You don&apos;t have any transactions with the connected accounts
          </h2>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="rounded-xl overflow-scroll-y max-h-[35vh]">
        <Table>
          {props.pending ? (
            pendingTransactions.length > 0 ? (
              <PendingTransactions />
            ) : (
              <NoTransactions />
            )
          ) : completedTransactions.length > 0 ? (
            <CompletedTransactions />
          ) : (
            <NoTransactions />
          )}
        </Table>
      </div>
    </div>
  );
}
