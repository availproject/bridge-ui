import { getBalance, writeContract } from "@wagmi/core";
import { encodeAbiParameters } from "viem";;
import {
  merkleProof,
} from "@/types/transaction";
import { bridgeContractAbi } from "@/constants/abi";
import { config } from "@/app/providers";
import { useCallback } from "react";
import { getAccountStorageProofs, getMerkleProof } from "@/services/api";
import { executeTransaction } from "@/services/vectorpallete";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";


export default function useClaim() {

  const {ethHead} = useLatestBlockInfo()


async function receiveAvail(merkleProof: merkleProof) {
    try {
      //@ts-ignore TODO: to be fixed later
      const result = await writeContract(config, {
        address: "0x967F7DdC4ec508462231849AE81eeaa68Ad01389",
        abi: bridgeContractAbi,
        functionName: "receiveAVAIL",
        args: [
          [
"0x02",
            merkleProof.message.from,
            merkleProof.message.to,
            merkleProof.message.originDomain,
            merkleProof.message.destinationDomain,
            encodeAbiParameters(
              [
                {
                  name: "assetId",
                  type: "bytes32",
                },
                {
                  name: "amount",
                  type: "uint256",
                },
              ],
              [
                merkleProof.message.message.fungibleToken.asset_id,
                merkleProof.message.message.fungibleToken.amount,
              ]
            ),
            merkleProof.message.id,
          ],
          [
merkleProof.dataRootProof,
            merkleProof.leafProof,
            merkleProof.rangeHash,
            merkleProof.dataRootIndex,
            merkleProof.blobRoot,
            merkleProof.bridgeRoot,
            merkleProof.leaf,
            merkleProof.leafIndex,
          ],
        ],
      });
      console.log(result, "result");
    } catch (e) {
      throw new Error("Error while claiming AVAIL");
    }
  }

const initClaimAvailToEth = useCallback(async ({
  blockhash,
  index,
}:{blockhash: `0x${string}`, index: number}) => {

  const a: merkleProof  = await getMerkleProof(blockhash, index)
  console.log(a,"merkle proof") //test and remove
  await receiveAvail(a)
},[])

const initClaimEthtoAvail = useCallback(async ({
  blockhash,
executeParams,

} : {
blockhash: `0x${string}`,
executeParams: {
messageid: number,amount: number,
from:`${string}` ,
to: `${string}`,
originDomain: number,
destinationDomain: number,
}

}) =>{

const proofs = await getAccountStorageProofs(blockhash, executeParams.messageid)
console.log(proofs, "proofs") //test and remove
console.log(executeParams, "executeParams") //test and remove
await executeTransaction({
  //confirm with @0xSasaPrsic that if the indexer gives ready to claim, the slot i get from ethHead should be good to go?
  slot: ethHead.slot,
  addrMessage: {
    message: {
      FungibleToken: {
        assetId: "0x0000000000000000000000000000000000000000000000000000000000000000",
        amount: 0
      },
    },
    from: proofs.accountProof[1],
    to: proofs.accountProof[2],
    originDomain: 0,
    destinationDomain: 0,
    id: executeParams.messageid
  },
  accountProof: proofs.accountProof,
  storageProof: proofs.storageProof
})

}, [])


return {initClaimAvailToEth, initClaimEthtoAvail}
}