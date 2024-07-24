import { NextRequest, NextResponse } from 'next/server';

/**
 * @description get the price of the token
 * 
 * @param {coins, fiats}
 * @sets price of the token in dollars
 * TODO: prefix with paid api key, once you get, don't add next_public
 */
async function getTokenPrices({ coins, fiats }: { coins: string; fiats: string }) {
  try {
    const response = await fetch(
      `https://pro-api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=${fiats}`,
      {
        headers: {
          'X-CG-Pro-API-Key': process.env.COINGECKO_API_KEY || '',
        }
      }
    );
    if (response.status !== 200) {
      throw new Error(`Failed to fetch token price ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const coins = searchParams.get('coins');
    const fiats = searchParams.get('fiats');

    if (!coins || !fiats) {
      throw new Error(`Invalid query params: coins=${coins}, fiats=${fiats}`);
    }

    const price = await getTokenPrices({ coins, fiats });
    if (!price) {
      throw new Error('Failed to fetch token price');
    }
    return NextResponse.json({ price }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
