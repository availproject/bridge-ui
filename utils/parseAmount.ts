import BigNumber from "bignumber.js";

export const parseAmount = (amount: string, decimals: number): string => {
    return new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals)).toString();
}

export const parseAvailAmount = (amount: string): string => {
    return parseAmount(amount, 18);
}
