const genericErrorMessage = 'Something went wrong!'


export function parseError(error: unknown): string {
    console.error(error)
    const errorMessageString: string = error instanceof Error ? error.message :
        typeof error === 'string' ? error : "";

    if (!errorMessageString) {
        return genericErrorMessage;
    }
    if(errorMessageString.match(/Cancelled/i)){
        return "You have rejected the transaction on your connected wallet.";
    }

    if (errorMessageString.match(/exceeds balance/i)) {
        return "Transfer amount is more than amount available in your wallet.";
    } else if (errorMessageString.match(/denied network switch/i)) {
        return "You denied the network switch. Please allow the switching to continue.";
    } else if (errorMessageString.match(/walletConnect network switch not supported/i)) {
        return "You may need to manually switch it to the correct network.";
    }  else if (errorMessageString.match(/No account selected/i)) {
        return "Please connect your accounts";
    } 
    else if (errorMessageString.match(/invalid network/i)) {
        return "You may need to manually switch it to the correct network."; }
    else if (
        errorMessageString.match(/denied transaction/i) || // Metamask browser message
        errorMessageString.match(/User rejected the transaction/i) || // Metamask mobile message
        errorMessageString.match(/User rejected the request/i) || // Rabby message
        errorMessageString.match(/user rejected transaction/i)
    ) {
        return "You have rejected the transaction on your connected wallet.";
    } else if (errorMessageString.match(/intrinsic gas too low/i)) {
        return "Provided gas is too low to complete this deposit, please allow suggested gas amount";
    } else if (errorMessageString.match(/transaction underpriced/i)) {
        return "Provided gas is too low to complete this deposit, please allow suggested gas amount";
    } else if (errorMessageString.match(/EXIT_ALREADY_PROCESSED/i)) {
        return "Exit already processed";
    } else if (errorMessageString.match(/nonce too low/i)) {
        return "Please clear the queue of your previous transactions on your wallet before proceeding with this transaction.";
    } else if (errorMessageString.match(/Incorrect Burn tx or Event Signature!/i)) {
        return "Please check if it is the current burn transaction hash and correct network/bridge selected. If the issue persists, please contact support.";
    } else if (errorMessageString.match(/error fetching allowance/i)) {
        return "Error fetching allowance.";
    } else if (errorMessageString.match(/insufficient balance/i)) {
        return "You do not have sufficient balance.";
    } else {
        if (typeof error === 'string') {
            return error;
        }

        return genericErrorMessage;
    }
}
