import { writeContract } from "@wagmi/core";
import { encodeAbiParameters } from "viem";
import { merkleProof } from "@/types/transaction";
import { bridgeContractAbi } from "@/constants/abi";
import { config } from "@/app/providers";
import {
  fetchLatestBlockhash,
  getAccountStorageProofs,
  getMerkleProof,
} from "@/services/api";
import { executeTransaction } from "@/services/vectorpallet";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { useAvailAccount } from "@/stores/availWalletHook";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";
import { Chain, TransactionStatus } from "@/types/common";
import useTransactions from "./useTransactions";
import { useAccount } from "wagmi";

export default function useClaim() {
  const { ethHead, latestBlockhash } = useLatestBlockInfo();
  const { selected } = useAvailAccount();
  const { address } = useAccount();
  const { addToLocalTransaction } = useTransactions();

  /**
   * @description Receive/Claim after the merkleProof is fetched from the api AVAIL on ETH
   * @param merkleProof 
   * @returns 
   */
  async function receiveAvail(merkleProof: merkleProof) {
    try {
      //@ts-ignore config gives a wagmi dep type error
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
              ],
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
    sourceTransactionHash,
    sourceTransactionIndex,
    sourceTimestamp,
    atomicAmount,
  }: {
    blockhash: `0x${string}`;
    sourceTransactionHash: `0x${string}`;
    sourceTransactionIndex: number;
    sourceTimestamp: string;
    atomicAmount: string;
  }) => {
    try {

      if (!address) throw new Error("Connect a Eth account");
      const a: merkleProof = await getMerkleProof(
        blockhash,
        sourceTransactionIndex,
      );
      if (!a) throw new Error("Failed to fetch proofs from api");

      const receive = await receiveAvail(a);
      if (receive) {
        console.log(
          "source txn hash of the txn to be added locally",
          sourceTransactionHash,
        );
        addToLocalTransaction({
          sourceChain: Chain.AVAIL,
          destinationChain: Chain.ETH,
          sourceTransactionHash: sourceTransactionHash,
          destinationTransactionHash: receive,
          amount: atomicAmount,
          status: TransactionStatus.CLAIM_PENDING,
          messageId: 0,
          dataType: "ERC20",
          depositorAddress: "",
          receiverAddress: "",
          sourceBlockHash: "0x",
          sourceTransactionBlockNumber: 0,
          sourceTransactionIndex: 0,
          sourceTimestamp: sourceTimestamp,
        });
      }
      console.log("added txn to local storage");
      return receive;
    } catch (e : any) {
      throw new Error(e.message as string);
    }
  };

  const initClaimEthtoAvail = async ({
    blockhash,
    executeParams,
    sourceTransactionHash,
    sourceTimestamp,
    atomicAmount,
  }: {
    blockhash: `0x${string}`;
    sourceTransactionHash: `0x${string}`;
    sourceTimestamp: string;
    atomicAmount: string;
    executeParams: {
      messageid: number;
      amount: number;
      from: `${string}`;
      to: `${string}`;
      originDomain: number;
      destinationDomain: number;
    };
  }) => {
    try {
    if (!selected) throw new Error("Connect a Avail account");
    const proofs = await getAccountStorageProofs(
      latestBlockhash.blockHash,
      executeParams.messageid,
    );

    if (!proofs) {
      throw new Error("Failed to fetch proofs from api");
    }

    const execute = await executeTransaction(
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

          //TODO: check if this is correct, should'nt be the way it is right now.
          originDomain: executeParams.destinationDomain,
          destinationDomain: executeParams.originDomain,
          id: executeParams.messageid,
        },
        accountProof: proofs.accountProof,
        storageProof: proofs.storageProof,
      },
      selected!,
    );
    addToLocalTransaction({
      sourceChain: Chain.ETH,
      destinationChain: Chain.AVAIL,
      sourceTransactionHash: sourceTransactionHash,
      destinationTransactionHash: execute.blockhash,
      amount: atomicAmount,
      status: TransactionStatus.CLAIM_PENDING,
      messageId: 0,
      dataType: "ERC20",
      depositorAddress: "",
      receiverAddress: "",
      sourceBlockHash: "0x",
      sourceTransactionBlockNumber: 0,
      sourceTransactionIndex: 0,
      sourceTimestamp: sourceTimestamp,
    });
    return execute;
  } catch (e : any) {
    throw new Error(e as string);
  };
}  

return { initClaimAvailToEth, initClaimEthtoAvail };

}