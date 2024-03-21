export enum ClaimType {
    GITHUB = "GITHUB",
    SUBSTRATE = "AVAIL",
    ETHEREUM = "ETHEREUM"
}

export enum ClaimStatus {
    CLAIMABLE="claimable",
    NOT_ELIGIBLE="not_eligible",
    ALREADY_CLAIMED="already_claimed",
    INVALID_SIGNATURE="invalid_signature",
}

export interface RewardData {
    message: ClaimStatus,
	data: {
		userId: string,
		amount: number,
		type: ClaimType,
        amountClaimed: number
	}

}

export interface ClaimData {
    message: ClaimStatus,
	data: {
		userId: string,
		amount: number,
		type: ClaimType,
        claimAddress:  `0x${string}`,
        claimTimpstamp: string
	}
}

export interface ClaimParams {
    account: string,
    type: ClaimType,
    message: ClaimStatus,
    timestamp: string,
    claimAddress:  `0x${string}`
}

// wallet disconnect on cross
//github auth simple using repo
// api fails errors
// end timestamp api
// check claimed rewards 
