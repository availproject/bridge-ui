import { NextRequest, NextResponse } from "next/server";
import { disconnect, isValidAddress } from "avail-js-sdk";
import { headers } from "next/headers";
import { _getBalance, isValidIPv4 } from "@/utils/common";
import { Chain } from "@/types/common";
import { parseAvailAmount } from "@/utils/parseAmount";

/**
 * @description  checks eligibilty -- avail balance less, have pending claimable txns on avail, then sends avail through faucet account for gas
 *
 * @param req
 * @param res
 */
export async function GET(request: NextRequest) {
  try {
    if (!process.env.FAUCET_ADDRESS) {
      return NextResponse.json(
        { success: false, message: "Internal error, missing values." },
        { status: 500 }
      );
    }
    const headersList = headers();

    const userAgent = headersList.get("user-agent");
    if (!userAgent || userAgent.includes("node-fetch")) {
      console.log("Bad agent");
      return NextResponse.json(
        { success: false, message: "Invalid user." },
        { status: 403 }
      );
    }

    const ip = headersList.get("x-real-ip");
    const address = request.nextUrl.searchParams.get("address");
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

    const network = request.nextUrl.searchParams.get("network");
    if (!network || (network !== "mainnet" && network !== "turing")) {
      console.log("Invalid network");
      return NextResponse.json(
        { success: false, message: "Invalid network" },
        { status: 403 }
      );
    }

    const avail = await _getBalance(Chain.AVAIL, address);
    if (!avail || parseAvailAmount(avail) > ".2") {
      return NextResponse.json(
        { success: false, message: "Insufficient balance." },
        { status: 400 }
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
