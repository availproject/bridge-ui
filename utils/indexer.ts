 

import { indexerInstance } from "./axios-instance";

import {TxnData } from "@/types/transaction";
import { Chain } from "@/types/common";

export async function fetchLatestTxns(
    sourceChain: Chain,
    destinationChain: Chain,
    userAddress?: `0x${string}`,
  ): Promise<{ txnData: TxnData[] }> {
    const response = await indexerInstance
      .get(`/transactions`, {
        params: {
          sourceChain,
          destinationChain,
          userAddress,
        },
      })
      .catch((e) => {
        console.log(e);
        return { data: { result: [] } };
      });
  
    const result: TxnData[] = response.data.result;
    return { txnData: result };
  }