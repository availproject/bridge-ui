import { Table, TableBody, TableCell, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { Chain } from "@/types/common";
import useTransactions from "@/hooks/useTransactions";
import { parseAvailAmount } from "@/utils/parseAmount";
import { ChainLabel } from "../ui/chainLabel";
import {
  parseDateTimeToMonthShort,
  parseDateTimeToDay,
} from "@/utils/parseDateTime";
import { ArrowRight } from "lucide-react";
import useClaim from "@/hooks/useClaim";
import { executeTransaction } from "@/services/vectorpallet";

export default function LatestTransactions(props: { pending: boolean }) {
  const { pendingTransactions, completedTransactions } = useTransactions();
  const { initClaimAvailToEth, initClaimEthtoAvail } = useClaim();

  const onSubmit = async (
    chainFrom: Chain,
    blockhash: `0x${string}`,
    index?: number,
    executeParams?: {
      messageid: number,
      amount: number,
      from: `${string}`,
      to: `${string}`,
      originDomain: number,
      destinationDomain: number
    }
  ) => {
    try {
      if (chainFrom === Chain.AVAIL && blockhash && index) {
        console.log("Initiate ReceiveAvail()");
        await initClaimAvailToEth({
          blockhash: blockhash,
          index: index,
        });

      } else if (chainFrom === Chain.ETH && blockhash && executeParams ) {
        console.log("Initiate Vector.Execute");
        await initClaimEthtoAvail({
          blockhash: blockhash,
          executeParams: executeParams,
        });
      } else {
        throw new Error("Invalid chain");
      }
    } catch (e) {}
    console.log("submit");
  };

  return (
    <div className="flex flex-col ">
      <div className="rounded-xl overflow-scroll-y max-h-[35vh]">
        <Table>
          {props.pending ? (
            <TableBody>
              {pendingTransactions.map((txn, index) => (
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
                          <ArrowRight />
                        </p>{" "}
                        <ChainLabel chain={txn.destinationChain} />
                      </p>

                      <p className="flex flex-row space-x-2">
                        <p className="text-white text-opacity-60 text-xs ml-2">
            
                          {
                          //@ts-ignore look at this once @ankitboghra
                          parseAvailAmount(txn.amount)} AVAIL
                        </p>
                      </p>
                    </p>

                    <br />
                  </TableCell>
                  <TableCell>
                    {txn.status === "READY_TO_CLAIM" ? (
                      <>
                        <Button
                          variant="primary"
                          onClick={() =>
                            onSubmit(
                              txn.sourceChain,
                              txn.sourceBlockHash,
                              index,
                              {
                                messageid: txn.messageId,
                                amount: txn.amount,
                                from: txn.depositorAddress,
                                to: txn.receiverAddress,
                                originDomain: 1,
                                destinationDomain: 2
                              }
                            )
                          }
                        >
                          {txn.status === "READY_TO_CLAIM"
                            ? "Claim"
                            : txn.status}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge>{txn.status}</Badge>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              {completedTransactions.map((txn, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium w-full flex flex-row space-x-2">
                    <p className="flex flex-col">
                      <p className="text-white text-opacity-60 flex flex-col items-center justify-center">
                        <p className="text-white text-md">
                          {`${new Date(
                            txn.sourceTransactionTimestamp
                          ).toLocaleDateString("en-GB", { day: "numeric" })}
   `}
                        </p>
                        <p>{` ${new Date(txn.sourceTransactionTimestamp)
                          .toLocaleDateString("en-GB", { month: "short" })
                          .toUpperCase()}`}</p>
                      </p>
                      {/* <p className="text-white text-opacity-60">{` ${new Date(
                        txn.sourceTransactionTimestamp
                      ).getHours()}${new Date(
                        txn.sourceTransactionTimestamp
                      ).getMinutes()}`}</p> */}
                    </p>
                    <p className="flex flex-col space-y-1 ">
                      <p className="flex flex-row w-full">
                        {" "}
                        {txn.sourceChain === Chain.ETH ? (
                          <p className="flex flex-row space-x-1">
                            {" "}
                            <Image
                              src="/images/eth.png"
                              alt="eth"
                              width={10}
                              height={10}
                            ></Image>
                            <p>ETH</p>
                          </p>
                        ) : (
                          <p className="flex flex-row space-x-1">
                            {" "}
                            <Image
                              src="/images/logo.png"
                              alt="avail"
                              width={10}
                              height={10}
                            ></Image>
                            <p>AVAIL</p>
                          </p>
                        )}{" "}
                        <p className="px-1">
                          <ArrowRight />
                        </p>{" "}
                        {txn.destinationChain === Chain.ETH ? (
                          <p className="flex flex-row space-x-1">
                            {" "}
                            <Image
                              src="/images/eth.png"
                              alt="eth"
                              width={10}
                              height={10}
                            ></Image>
                            <p>ETH</p>
                          </p>
                        ) : (
                          <p className="flex flex-row space-x-1">
                            {" "}
                            <Image
                              src="/images/logo.png"
                              alt="avail"
                              width={10}
                              height={10}
                            ></Image>
                            <p>AVAIL</p>
                          </p>
                        )}{" "}
                      </p>

                      <p className="flex flex-row space-x-2">
                        <p className="text-white text-opacity-60 text-xs ml-2">
                          {" "}
                          Sent 1200 AVAIL
                        </p>
                      </p>
                    </p>

                    <br />
                  </TableCell>
                  <TableCell>
                    <Badge>{txn.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>
    </div>
  );
}
