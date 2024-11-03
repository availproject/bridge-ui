import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Transaction } from "@/types/transaction";
import ParsedDate from "./parseddate";
import TxnAddresses from "./txnaddresses";
import { ChainLabel } from "@/components/ui/chainLabel";
import { ArrowUpRight, MoveRight } from "lucide-react";
import { Chain } from "@/types/common";
import { Badge } from "@/components/ui/badge";
import { parseAvailAmount } from "@/utils/parsers";

function CompletedTransactions({
    completedTransactions,
  }: {
    completedTransactions: Transaction[];
  }) {
    return (
      <div className="flex h-[85%]">
        <TableBody className="overflow-y-scroll min-w-[99%] mx-auto space-y-2.5">
          {completedTransactions &&
            completedTransactions.map((txn, index) => (
              <TableRow
                className="flex overflow-x-scroll flex-row justify-between w-[100%] bg-[#363b4f] rounded-xl "
                key={txn.sourceTransactionHash}
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
                          parseAvailAmount(txn.amount)
                        }{" "}
                        AVAIL
                      </p>
                      <a
                        target="_blank"
                        href={
                          txn.sourceChain === Chain.ETH
                            ? `${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL}/tx/${txn.sourceTransactionHash}`
                            : `${process.env.NEXT_PUBLIC_SUBSCAN_URL}/extrinsic/${txn.sourceBlockNumber}-${txn.sourceTransactionIndex}`
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

  export default CompletedTransactions;