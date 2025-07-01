import { ChainLabel } from "@/components/ui/chainLabel";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Transaction } from "@/types/transaction";
import { parseAvailAmount } from "@/utils/parsers";
import { MoveRight, ArrowUpRight, Clock, AlertTriangle } from "lucide-react";
import ParsedDate from "./parseddate";
import TxnAddresses from "./txn-addresses";
import { useState } from "react";
import { SubmitClaim } from "./submitclaim";
import { RetryTxns } from "./retrytxns";
import { getHref } from "@/utils/common";
import { StatusBadge } from "./statusbadge";
import { StatusTimeComponent } from "./statustime";

export const PendingTransactions = ({
  pendingTransactions,
}: {
  pendingTransactions: Transaction[];
}) => {
  const [loadingTxns, setLoadingTxns] = useState(new Set());

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
  return (
    <Table className="flex h-[85%]">
      <TableBody className="overflow-y-scroll min-w-[99%] mx-auto space-y-2.5">
        {pendingTransactions &&
          pendingTransactions.map((txn: Transaction) => (
            <TableRow
              className="flex flex-col overflow-x-scroll w-[100%] bg-[#363b4f] rounded-xl"
              key={txn.sourceTransactionHash}
            >
              <div className="flex flex-row justify-between w-full">
                <TableCell className="font-medium flex flex-row rounded-xl">
                  <div className="hidden md:flex">
                    <ParsedDate sourceTimestamp={txn.sourceTimestamp} />
                  </div>

                  <span className="flex flex-col-reverse items-start justify-center">
                    <TxnAddresses txn={txn} />
                    <span className="flex flex-row w-full">
                      <ChainLabel chain={txn.sourceChain} />
                      <p className="md:px-4 px-2">
                        <MoveRight />
                      </p>
                      <ChainLabel chain={txn.destinationChain} />
                      <div className="md:hidden flex">
                        <ParsedDate sourceTimestamp={txn.sourceTimestamp} />
                      </div>
                    </span>
                    <span className="flex flex-row space-x-2">
                      <p className="text-white !text-md lg:text-lg font-thicccboisemibold">
                        {parseAvailAmount(txn.amount, 18)} AVAIL
                      </p>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={getHref(
                          txn.sourceChain,
                          txn.sourceTransactionHash,
                        )}
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
                        <SubmitClaim
                          txn={txn}
                          loadingTxns={loadingTxns}
                          setTxnLoading={setTxnLoading}
                        />
                      ) : txn.status === "RETRY" ? (
                        <RetryTxns
                          txn={txn}
                          loadingTxns={loadingTxns}
                          setTxnLoading={setTxnLoading}
                        />
                      ) : (
                        <StatusBadge txnStatus={txn.status} />
                      )}
                    </span>
                    <p className="text-xs flex flex-row items-end justify-end text-right text-white text-opacity-70 space-x-1">
                      <span>
                        <StatusTimeComponent txn={txn} />
                      </span>{" "}
                    </p>
                  </div>
                </TableCell>
              </div>
              {/* Warning Message for RETRY transactions */}
              {/* {txn.status === "RETRY" && (
                <div className="flex items-center space-x-2 p-3 mx-4 mb-3 bg-yellow-900/20 border border-yellow-900/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 font-thin" />
                  <p className="text-yellow-400 text-sm font-thin">
                    Retry now to avoid a 7-day wait for your funds.
                  </p>
                </div>
              )} */}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};
