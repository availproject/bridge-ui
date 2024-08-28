import { Logger } from "@/utils/logger";
import { NextRequest, NextResponse } from "next/server";

interface TokenPrice {
  price: {
    [coin: string]: {
      [fiat: string]: number;
    }[];
  };
}

/**
 * @description get the price of the token
 *
 * @param {coins, fiats}
 * @sets price of the token in dollars
 *
 * @returns {price: {coin: {fiat: number} }[] }
 */
async function getTokenPrices({
  coins,
  fiats,
}: {
  coins: string;
  fiats: string;
}): Promise<TokenPrice> {
  try {
    const response = await fetch(
      `https://pro-api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=${fiats}`,
      {
        headers: {
          "X-CG-Pro-API-Key": process.env.COINGECKO_API_KEY || "",
        },
      }
    );
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch token price ${response.status} ${response.statusText}`
      );
    }
    const data:TokenPrice = await response.json();
    return data;
  } catch (error) {
    Logger.error(`Error fetching token price: ${error}`)
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const coins = searchParams.get("coins");
    const fiats = searchParams.get("fiats");

    if (!coins || !fiats) {
      throw new Error(`Invalid query params: coins=${coins}, fiats=${fiats}`);
    }

    const price = await getTokenPrices({ coins, fiats });
    if (!price) {
      throw new Error("Failed to fetch token price");
    }
    return NextResponse.json({ price }, { status: 200 });
  } catch (error: any) {
    console.error(`Error in GET handler: ${error}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
