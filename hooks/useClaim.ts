import { writeContract } from "@wagmi/core";
import { encodeAbiParameters } from "viem";
import { merkleProof } from "@/types/transaction";
import { bridgeContractAbi } from "@/constants/abi";
import { config } from "@/app/providers";
import { fetchLatestBlockhash, getAccountStorageProofs, getMerkleProof } from "@/services/api";
import { executeTransaction } from "@/services/vectorpallet";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { useAvailAccount } from "@/stores/availWalletHook";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";

export default function useClaim() {
  const { ethHead, latestBlockhash } = useLatestBlockInfo();
  const { selected } = useAvailAccount();

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
      return result;
    } catch (e) {
      throw new Error("Error while claiming AVAIL");
    }
  }

  const initClaimAvailToEth = async ({
    blockhash,
    sourceTransactionIndex,
  }: {
    blockhash: `0x${string}`;
    sourceTransactionIndex: number;
  }) => {
    try {
      //ask sasa about this index, can we get this from indexer?
    const a: merkleProof = await getMerkleProof(blockhash, sourceTransactionIndex);
    if (!a) throw new Error("Failed to fetch proofs from api");

    const receive = await receiveAvail(a);
    return receive;
    
    } catch (e) {
      throw new Error("Error while claiming AVAIL");
    }
   
  };

  const initClaimEthtoAvail = async ({
    blockhash,
    executeParams,
  }: {
    blockhash: `0x${string}`;
    executeParams: {
      messageid: number;
      amount: number;
      from: `${string}`;
      to: `${string}`;
      originDomain: number;
      destinationDomain: number;
    };
  }) => {
    if (!selected) throw new Error("Connect a Avail account");
    const proofs = await getAccountStorageProofs(
      latestBlockhash.blockHash,
      executeParams.messageid
    );
    
    if (!proofs) { 
      throw new Error("Failed to fetch proofs from api") 
  }

    const execute =  await executeTransaction(
      {
        slot: ethHead.slot,
        addrMessage: {
          message: {
            FungibleToken: {
              assetId:
                "0x0000000000000000000000000000000000000000000000000000000000000000",
              amount: executeParams.amount,
            },
          },
          from: `${executeParams.from.padEnd(66, "0")}`,
          to: u8aToHex(decodeAddress(executeParams.to)),

          //@rac-sri we need to change this in the indexer
          originDomain: executeParams.destinationDomain,
          destinationDomain: executeParams.originDomain,
          id: executeParams.messageid,
        },
        accountProof: proofs.accountProof,
        storageProof: proofs.storageProof,
      },
      selected!
    );
    console.log(execute)
    return execute;
  };

  return { initClaimAvailToEth, initClaimEthtoAvail };
}
