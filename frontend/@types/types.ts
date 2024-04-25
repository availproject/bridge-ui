export enum Chain {
  AVAIL = "AVAIL",
  ETH = "ETHEREUM",
}

export interface sendMessageParams {
  message: {
    ArbitraryMessage?: `0x${string}`;
    FungibleToken?: {
        assetId: `0x${string}`;
        amount: number;
    }

  };
  to: `0x${string}`;
  domain: number;
}

export interface executeParams {
    slot: number;
    addrMessage: {
        message: {
            ArbitraryMessage?: `0x${string}`;
            FungibleToken?: {
                assetId: `0x${string}`;
                amount: number;
            } },
            from: `0x${string}`;
            to: `0x${string}`;
            originDomain: number;
            destinationDomain: number;
            id: number;


    },
    accountProof:{}
    storageProof:{}
}

//  const result = await api.tx.vector.sendMessage({ ArbitraryMessage: "azeazeaze" },"0x0000000000000000000000000000000000000000000000000000000000000000", 1).signAndSend(keyring, ({ status, events }) => {
//});
