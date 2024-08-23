import { NextRequest, NextResponse } from "next/server";
import { ApiPromise, disconnect, getKeyringFromSeed, initialize, isValidAddress } from "avail-js-sdk";
import { headers } from "next/headers";
import { _getBalance, isValidIPv4 } from "@/utils/common";
import { Chain } from "@/types/common";
import { parseAvailAmount } from "@/utils/parseAmount";
import { substrateConfig } from "@/config/walletConfig";
import { SignerOptions } from "@polkadot/api/types";
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const FAUCET_AMOUNT = BigInt(process.env.FAUCET_AMOUNT || "250000000000000000"); // 0.25 AVAIL
const MIN_FAUCET_BALANCE = BigInt(process.env.MIN_FAUCET_BALANCE || "10000000000000000000"); // 10 AVAIL
const MAX_USER_BALANCE: number = parseFloat(process.env.MAX_USER_BALANCE || "0.5"); // 0.5 AVAIL

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '10s'),
});

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { address, network } = await validateRequest(request);
    const availBalance = await _getBalance(Chain.AVAIL, address);

    if (availBalance && Number(parseAvailAmount(availBalance)) >= MAX_USER_BALANCE) {
      return errorResponse("Avail balance too high.", 503);
    }

    const api = await initialize(substrateConfig.endpoint);
    const keyring = getKeyringFromSeed(process.env.FAUCET_SEED!);
    const faucetBalance = await getFaucetBalance(api);

    if (faucetBalance < MIN_FAUCET_BALANCE) {
      return errorResponse("Faucet balance too low.", 503);
    }

    const result = await sendFaucetTransaction(api, keyring, address);

    if (!result.txHash) {
      return errorResponse("Faucet failed.", 500);
    }

    return successResponse(`${result.txHash}`);
  } catch (err: any) {
    return errorResponse(err.message || JSON.stringify(err), 500);
  } finally {
    disconnect();
  }
}


/**
 * @description get the address, network and validate the request 
 * 
 * @param request 
 * @returns { address, network }
 */
async function validateRequest(request: NextRequest) {
  const headersList = headers();
  const ip = headersList.get("x-real-ip");
  const address = request.nextUrl.searchParams.get("address");
  const userAgent = headersList.get("user-agent");
  const network = request.nextUrl.searchParams.get("network");

  const { remaining } = await ratelimit.limit(ip ?? '127.0.0.1');

  if (!process.env.FAUCET_ADDRESS || !process.env.FAUCET_SEED || !process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error("Missing environment variables");
  }

  if (remaining === 0) {
    throw new Error("Too many requests");
  }


  if (!userAgent || userAgent.includes("node-fetch")) {
    throw new Error("Invalid user agent");
  }

  if (!address || !isValidAddress(address)) {
    throw new Error("Invalid address");
  }

  if (ip && !isValidIPv4(ip)) {
    throw new Error("Invalid IP");
  }

  if (!network || (network !== "mainnet" && network !== "turing")) {
    throw new Error("Invalid network");
  }

  return { address, network };
}

async function getFaucetBalance(api: any): Promise<bigint> {
  const faucetData: any = await api.query.system.account(process.env.FAUCET_ADDRESS);
  return faucetData.data.free;
}


async function sendFaucetTransaction(api: ApiPromise, keyring: any, address: string): Promise<{ blockhash: string, txHash: string }> {
  console.log(`Sending faucet transaction to`);
  return new Promise((resolve, reject) => {
    const unsubscribe = api.tx.balances
      .transferKeepAlive(address, FAUCET_AMOUNT)
      .signAndSend(keyring, { app_id: 0 } as Partial<SignerOptions>, handleTransactionStatus(api, resolve, reject) as any);

    return async () => (await unsubscribe)();
  });
}

function handleTransactionStatus(api: ApiPromise, resolve: Function, reject: Function) {
  return ({ status, events, txHash }: { status: any, events: any[], txHash: string }) => {
    if (status.isInBlock) {
      console.log(`Transaction included at block: ${status.asInBlock.toString()}`);
      
       events.forEach((event) => {
        if (api.events.system.ExtrinsicFailed.is(event)) {
          const errorInfo = getErrorInfo(api, event);
          console.log(`Transaction failed. Status: ${status} with error: ${errorInfo}`);
          reject(new Error(`Transaction failed. Status: ${status} with error: ${errorInfo}`));
        }
        
      });

      resolve({ blockhash: status.asInBlock.toString(), txHash: txHash.toString() });
    }
  };
}

function getErrorInfo(api: any, event: any) {
  const [dispatchError] = event.data;
  if (dispatchError.isModule) {
    const decoded = api.registry.findMetaError(dispatchError.asModule);
    return `${decoded.section}.${decoded.name}`;
  }
  return dispatchError.toString();
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function successResponse(message: string) {
  return NextResponse.json({ success: true, message }, { status: 200 });
}