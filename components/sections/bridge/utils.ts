import { Chain } from "@/types/common";
import { decimal_points } from "@/utils/common";
import BigNumber from "bignumber.js";

export const getMaxAmount = (amount: string, fromChain: Chain) => {
    if (fromChain === Chain.AVAIL) {
        console.log(BigNumber(amount).minus(new BigNumber(0.25)).toFixed(decimal_points), amount, "ll   ");
       return BigNumber(amount).minus(new BigNumber(0.25)).toFixed(decimal_points);
    }
    return amount;
}

export const validInputAmount = (amount: string) => {
    if (isNaN(Number(amount))) {
        return false;
    }
    return true;
}