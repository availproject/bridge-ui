import { ChainLabel } from "@/components/ui/chainLabel";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Chain } from "@/types/common";
import { Transaction } from "@/types/transaction";
import { parseAvailAmount } from "@/utils/parsers";
import { MoveRight, ArrowUpRight, Clock } from "lucide-react";
import ParsedDate from "./parseddate";
import TxnAddresses from "./txnaddresses";
import { useState } from "react";
import { SubmitClaim } from "./submitclaim";
import { Badge } from "@/components/ui/badge";

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
                  <TxnAddresses txn={txn} />
                  <span className="flex flex-row w-full">
                    <ChainLabel chain={txn.sourceChain} />
                    <p className="md:px-4 px-2">
                      <MoveRight />
                    </p>
                    <ChainLabel
                      chain={
                        txn.sourceChain === Chain.AVAIL
                          ? Chain.ETH
                          : Chain.AVAIL
                      }
                    />
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
                      <SubmitClaim
                        txn={txn}
                        loadingTxns={loadingTxns}
                        setTxnLoading={setTxnLoading}
                      />
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
                      {/* {getStatusTime({
                          from: txn.sourceChain,
                          status: txn.status,
                          heads: { eth: ethHead, avl: avlHead },
                        })} */}
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
