import BigNumber from "bignumber.js";
import { Logger } from "./logger";
import { decimal_points } from "./common";

const genericErrorMessage = 'Something went wrong!'


export const parseAmount = (amount: string, decimals: number): string => {
    return new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals)).toFixed(decimal_points);
}

export const parseAvailAmount = (amount: string, decimals: number): string => {
    return new BigNumber(amount.replace(/,/g, '')).dividedBy(new BigNumber(10).pow(decimals)).toFixed(decimal_points);
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
  
  export function parseError(error: any): string {
      Logger.error(error)
      const errorMessageString: string = error instanceof Error ? error.message :
          typeof error === 'string' ? error : "";
      if (!errorMessageString) {
          return genericErrorMessage;
      }
      if (errorMessageString.match(/Cancelled/i)) {
          return "You have rejected the transaction on your connected wallet.";
      }
      if (errorMessageString.match(/Connect a Eth account/i)) {
          return "Connect an Ethereum account to proceed.";
      }
      if (errorMessageString.match(/Connect a Avail account/i)) {
          return "Connect an Avail account to proceed.";
      }
      if (errorMessageString.match(/exceeds balance/i)) {
          return "Transfer amount is more than amount available in your wallet.";
      } if (errorMessageString.match(/denied network switch/i)) {
          return "You denied the network switch. Please allow the switching to continue.";
      } if (errorMessageString.match(/walletConnect network switch not supported/i)) {
          return "You may need to manually switch it to the correct network.";
      } if (errorMessageString.match(/No account selected/i)) {
          return "Please connect your accounts";
      }
      if (errorMessageString.match(/Failed to fetch proofs from api/i)) {
          return "Failed to fetch proofs from API. Contact Support";
      }
      if (errorMessageString.match(/invalid network/i)) {
          return "Network not supported. Please switch to the correct network.";
      }
      if (errorMessageString.match(/Network not supported/i)) {
          return "Network not supported, switching to the correct network. Retry the transaction.";
      }
      if(errorMessageString.match(/Cannot read properties of null (reading 'signature')/i)) {
          return "Transaction rejected, please try again.";
       }
      
      if (
          errorMessageString.match(/denied transaction/i) || // Metamask browser message
          errorMessageString.match(/User rejected the transaction/i) || // Metamask mobile message
          errorMessageString.match(/User rejected the request/i) || // Rabby message
          errorMessageString.match(/user rejected transaction/i) || // subwallet message
          errorMessageString.match(/Rejected by user/i)
      ) {
          return "You have rejected the transaction on your connected wallet.";
      } if (errorMessageString.match(/bad signature/i)) {
          return "You need to update chain metadata, checkout the FAQ's for more information.";
      }
      if (errorMessageString.match(/intrinsic gas too low/i)) {
          return "Provided gas is too low to complete this deposit, please allow suggested gas amount";
  
      } if (errorMessageString.match(/transaction underpriced/i)) {
          return "Provided gas is too low to complete this deposit, please allow suggested gas amount";
      } if (errorMessageString.match(/EXIT_ALREADY_PROCESSED/i)) {
          return "Exit already processed";
      } if (errorMessageString.match(/nonce too low/i)) {
          return "Please clear the queue of your previous transactions on your wallet before proceeding with this transaction.";
      } if (errorMessageString.match(/Incorrect Burn tx or Event Signature!/i)) {
          return "Please check if it is the current burn transaction hash and correct network/bridge selected. If the issue persists, please contact support.";
      } if (errorMessageString.match(/error fetching allowance/i)) {
          return "Error fetching allowance.";
      } if (errorMessageString.match(/insufficient balance/i)) {
          return "You do not have sufficient balance.";
      }
       if (errorMessageString.match(/Failed to fetch heads from api/i)) {
      return "Beep Boop! Failed to fetch latest slot. Please refresh and try again";
  }
      if (typeof error === 'string') {
          return error;
      }
  
      return genericErrorMessage;
  
  }
  