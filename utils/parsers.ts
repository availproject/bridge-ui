import BigNumber from "bignumber.js";

export const parseAmount = (amount: string, decimals: number): string => {
    return new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals)).toString();
}

export const parseAvailAmount = (amount: string): string => {
    return parseAmount(amount, 18);
}

export const parseDateTimeToMonthShort = (dateTime: string) => {
    return new Date(dateTime)
        .toLocaleDateString("en-GB", { month: "short" })
        .toUpperCase()
}

export const parseDateTimeToDay = (dateTime: string) => {
    return new Date(dateTime)
        .toLocaleDateString("en-GB", { day: "numeric" })
        .toUpperCase()
}

export const parseMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainderMinutes = Math.round(minutes % 60);
  
    return `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ` : ''}${remainderMinutes} minutes`;
  }
  
