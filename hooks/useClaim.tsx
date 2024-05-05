import { writeContract } from "@wagmi/core";
import { encodeAbiParameters } from "viem";;
import {
  merkleProof,
} from "@/types/transaction";
import { bridgeContractAbi } from "@/constants/abi";
import { config } from "@/app/providers";
import { getAccountStorageProofs, getMerkleProof } from "@/services/api";
import { executeTransaction } from "@/services/vectorpallet";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { useAvailAccount } from "@/stores/availWalletHook";


export default function useClaim() {
  const {ethHead, latestBlockhash} = useLatestBlockInfo()
  const {selected} = useAvailAccount()

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

const initClaimAvailToEth = async ({
  blockhash,
  index,
}:{blockhash: `0x${string}`, index: number}) => {

  const a: merkleProof  = await getMerkleProof(blockhash, index)
  console.log(a,"merkle proof") //test and remove
  const receive = await receiveAvail(a)
  return receive
}

const initClaimEthtoAvail = async ({
  blockhash,
  executeParams,

} : {
blockhash: `0x${string}`,
executeParams: {
messageid: number,
amount: number,
from:`${string}` ,
to: `${string}`,
originDomain: number,
destinationDomain: number,
}

}) =>{

if(!selected) throw new Error("Connect a Avail account")
const proofs = await getAccountStorageProofs(latestBlockhash.blockHash, executeParams.messageid)
// const proofs = await getAccountStorageProofs(blockhash, executeParams.messageid)
if(!proofs) throw new Error("Failed to fetch proofs from api")

  console.log(proofs, executeParams, "proofs")
console.log(latestBlockhash.blockHash)

await executeTransaction({
  slot: ethHead.slot,
  addrMessage: {
    message: {
      FungibleToken: {
        assetId: "0x0000000000000000000000000000000000000000000000000000000000000000",
        amount: executeParams.amount
      },
    },
    from: executeParams.from,
    to: executeParams.to,
    originDomain: executeParams.originDomain,
    destinationDomain: executeParams.destinationDomain,
    id: executeParams.messageid
  },

  accountProof: proofs.accountProof,
  storageProof: proofs.storageProof
}, selected!)

}

return {initClaimAvailToEth, initClaimEthtoAvail}
}