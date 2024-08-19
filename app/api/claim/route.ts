import { NextRequest, NextResponse } from "next/server";
import {
  disconnect,
  getKeyringFromSeed,
  initialize,
  isValidAddress,
} from "avail-js-sdk";
import { headers } from "next/headers";
import { _getBalance, isValidIPv4 } from "@/utils/common";
import { Chain } from "@/types/common";
import { parseAvailAmount } from "@/utils/parseAmount";
import { substrateConfig } from "@/config/walletConfig";
import { SignerOptions } from "@polkadot/api/types";
import { toast } from "@/components/ui/use-toast";

/**
 * @description  checks eligibilty -- avail balance less, have pending claimable txns on avail, then sends avail through faucet account for gas
 *
 * @param req
 * @param res
 */
export async function GET(request: NextRequest) {
  try {
    if (!process.env.FAUCET_ADDRESS || !process.env.FAUCET_SEED) {
      return NextResponse.json(
        { success: false, message: "Internal error, missing values." },
        { status: 500 }
      );
    }
    const headersList = headers();
    const ip = headersList.get("x-real-ip");
    const address = request.nextUrl.searchParams.get("address");
    const userAgent = headersList.get("user-agent");
    const network = request.nextUrl.searchParams.get("network");

    if (!userAgent || userAgent.includes("node-fetch")) {
      console.log("Bad agent");
      return NextResponse.json(
        { success: false, message: "Invalid user." },
        { status: 403 }
      );
    }
    if (!address || !isValidAddress(address))
      return NextResponse.json(
        { success: false, message: "Invalid address." },
        { status: 400 }
      );
    if (ip && !isValidIPv4(ip))
      return NextResponse.json(
        { success: false, message: "Invalid ip." },
        { status: 400 }
      );
    if (!network || (network !== "mainnet" && network !== "turing")) {
      console.log("Invalid network");
      return NextResponse.json(
        { success: false, message: "Invalid network" },
        { status: 403 }
      );
    }

    const avail = await _getBalance(Chain.AVAIL, address);

    if (avail && parseAvailAmount(avail) < ".1") {
      const api = await initialize(substrateConfig.endpoint);
      const keyring = getKeyringFromSeed(process.env.FAUCET_SEED);

      const faucetData: any = await api.query.system.account(
        process.env.FAUCET_ADDRESS
      );
      const faucetBalance = Number(
        Number(faucetData.data.free / Math.pow(10, 18)).toFixed(1)
      );

      //TODO: fix this to use the correct low amount
      if (faucetBalance < 10) {
        return NextResponse.json(
          {
            success: false,
            message: "Internal error, faucet balance too low.",
          },
          { status: 503 }
        );
      }

      const result: {blockhash: string, txHash: string} = await new Promise((resolve, reject) => {
        const unsubscribe = api.tx.balances
          .transferKeepAlive(address, BigInt(100000000000000000))
          .signAndSend(
            keyring,
            { app_id: 0 } as Partial<SignerOptions>,
            ({ status, events, txHash }) => {
              if (status.isInBlock) {
                console.log(
                  `Transaction included at blockHash ${status.asInBlock} ${txHash} `
                );
    
                events.forEach(({ event }) => {
                  if (api.events.system.ExtrinsicFailed.is(event)) {
                    const [dispatchError] = event.data;
                    let errorInfo: string;
                    //@ts-ignore
                    if (dispatchError.isModule) {
                      const decoded = api.registry.findMetaError(
                                   //@ts-ignore
                        dispatchError.asModule
                      );
                      errorInfo = `${decoded.section}.${decoded.name}`;
                    } else {
                      errorInfo = dispatchError.toString();
                    }
    
                    toast({
                      title: `Transaction failed. Status: ${status} with error: ${errorInfo}`,
                    });
                    console.log(`ExtrinsicFailed: ${errorInfo}`);
                    reject(
                      new Error(
                        `Transaction failed. Status: ${status} with error: ${errorInfo}`
                      )
                    );
                  }
    
                  if (api.events.system.ExtrinsicSuccess.is(event)) {
                    console.log(
                      "Transaction successful with hash:",
                      status.asInBlock
                    );
                    resolve({blockhash: status.asInBlock.toString(), txHash: txHash.toString()});
                  }
                });
                //@ts-ignore
                unsubscribe();
              }
            }
          )
          .catch((error) => {
            console.error("Error in signAndSend:", error);
            reject(error);
            return {
              status: "failed",
              message: error,
            };
          });
      });

      if (!result.txHash) {
        return NextResponse.json(
          { success: false, message: "Internal error, faucet failed." },
          { status: 500 }
        );
      }
      if (result.txHash) {
        return NextResponse.json(
          { success: true, message: `Faucet success. here is the transaction hash ${result.txHash}` },
          { status: 200 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Internal error, avail balance too high." },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { error: err.message ? err.message : JSON.stringify(err) },
      { status: 500 }
    );
  } finally {
    disconnect();
  }
}
