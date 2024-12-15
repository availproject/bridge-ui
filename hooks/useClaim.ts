import { estimateGas, readContract, writeContract } from "@wagmi/core";
import { encodeAbiParameters, encodeFunctionData, formatUnits } from "viem";
import { executeParams, merkleProof } from "@/types/transaction";
import ethereumBridgeMainnet from "@/constants/abis/ethereumBridgeMainnet.json";
import ethereumBridgeTuring from "@/constants/abis/ethereumBridgeTuring.json";

import { getAccountStorageProofs, getMerkleProof } from "@/services/api";
import { executeTransaction } from "@/services/vectorpallet";
import { useLatestBlockInfo } from "@/stores/lastestBlockInfo";
import { useAvailAccount } from "@/stores/availWalletHook";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";
import { Chain, TransactionStatus } from "@/types/common";
import useTransactions from "./useTransactions";
import { useAccount } from "wagmi";
import { appConfig } from "@/config/default";
import useEthWallet from "./useEthWallet";
import { Logger } from "@/utils/logger";
import { useCommonStore } from "@/stores/common";
import { initApi } from "@/utils/common";
import { ApiPromise } from "avail-js-sdk";
import { useInvokeSnap } from "./Metamask/useInvokeSnap";
import { checkTransactionStatus } from "./Metamask/utils";
import {
  Transaction as MetamaskTransaction,
  TxPayload,
} from "@avail-project/metamask-avail-types";
import { config } from "@/config/walletConfig";
import useAppInit from "./useAppInit";

export default function useClaim() {
  const { ethHead } = useLatestBlockInfo();
  const { switchNetwork, activeNetworkId } = useEthWallet();
  const { selected } = useAvailAccount();
  const { address } = useAccount();
  const { addToLocalTransaction } = useTransactions();
  const { api, setApi } = useCommonStore();
  const { refetchHeads } = useAppInit();

  const invokeSnap = useInvokeSnap();

  const networks = appConfig.networks;

  /**
   * @description Validates chain according to transaction type, and changes chain if needed
   * @param txType Transaction type
   */
  const validateChain = async () => {
    if (networks.ethereum.id !== (await activeNetworkId())) {
      await switchNetwork(networks.ethereum.id);
    }
  };

  /**
   * @description Receive/Claim after the merkleProof is fetched from the api AVAIL on ETH
   * @param merkleProof
   * @returns
   */
  async function receiveAvail(merkleProof: merkleProof) {
    try {
      // const contractParams = {
      //   abi: ethereumBridgeMainnet,
      //   functionName: "receiveAVAIL",
      //   args: [
      //     [
      //       "0x02",
      //       merkleProof.message.from,
      //       merkleProof.message.to,
      //       merkleProof.message.originDomain,
      //       merkleProof.message.destinationDomain,
      //       encodeAbiParameters(
      //         [
      //           {
      //             name: "assetId",
      //             type: "bytes32",
      //           },
      //           {
      //             name: "amount",
      //             type: "uint256",
      //           },
      //         ],
      //         [
      //           merkleProof.message.message.fungibleToken.asset_id,
      //           BigInt(merkleProof.message.message.fungibleToken.amount),
      //         ]
      //       ),
      //       merkleProof.message.id,
      //     ],
      //     [
      //       merkleProof.dataRootProof,
      //       merkleProof.leafProof,
      //       //check
      //       merkleProof.rangeHash,
      //       //check
      //       merkleProof.dataRootIndex,
      //       merkleProof.blobRoot,
      //       merkleProof.bridgeRoot,
      //       merkleProof.leaf,
      //       merkleProof.leafIndex,
      //     ],
      //   ],
      // };

      // console.log(
      //   "contractParams",
      //   contractParams,
      //   merkleProof.rangeHash,
      //   merkleProof.dataRootIndex
      // );

      // const estimatedGas = await estimateGas(config, {
      //   to: appConfig.contracts.avail.bridge as `0x${string}`,
      //   data: encodeFunctionData(contractParams)
      // })

      // const gasWithBuffer = BigInt(10000000)
      // (estimatedGas * BigInt(120)) / BigInt(100);

      const result = await writeContract(config, {
        address: process.env.NEXT_PUBLIC_BRIDGE_PROXY_CONTRACT as `0x${string}`,
        abi:
        ethereumBridgeTuring,     
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
                BigInt(merkleProof.message.message.fungibleToken.amount),
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
    } catch (e: any) {
      throw new Error(`ERROR_RECIEVE_AVAIL ${e}`);
    }
  }

  const snapVectorExecute = async ({
    api,
    executeParams,
  }: {
    api: ApiPromise;
    executeParams: executeParams;
  }) => {
    try {
      const txPayload = await invokeSnap({
        method: "generateTransactionPayload",
        params: {
          module: "vector",
          method: "execute",
          args: [
            executeParams.slot,
            executeParams.addrMessage,
            executeParams.accountProof,
            executeParams.storageProof,
          ],
        },
      });

      const signedTx = await invokeSnap({
        method: "signPayloadJSON",
        params: {
          payload: (txPayload as TxPayload).payload,
        },
      });

      const txHash = await invokeSnap({
        method: "send",
        params: {
          signature: (signedTx as { signature: string }).signature,
          txPayload: txPayload,
          network: 1,
        },
      });

      const txnStatus = await checkTransactionStatus(
        api,
        (txHash as MetamaskTransaction).hash
      );

      return txnStatus.isOk()
        ? {
            blockHash: txnStatus.value.blockhash,
            txHash: (txHash as MetamaskTransaction).hash,
            status: "Success",
            message: "Transaction executed successfully",
          }
        : {
            status: "Failed",
            message: txnStatus.error.message,
          };
    } catch (e: any) {
      Logger.error(`ERROR_IN_SNAP_VECTOR_EXECUTE: ${e}`);
      throw e;
    }
  };

  const initClaimAvailToEth = async ({
    blockhash,
    sourceTransactionHash,
    sourceTransactionIndex,
    sourceTimestamp,
    atomicAmount,
    senderAddress,
    receiverAddress,
  }: {
    blockhash: `0x${string}`;
    sourceTransactionHash: `0x${string}`;
    sourceTransactionIndex: number;
    sourceTimestamp: string;
    atomicAmount: string;
    senderAddress: string;
    receiverAddress: string;
  }) => {
    try {
      if (!address) throw new Error("Connect a Eth account");
      console.log("blockhash", blockhash);
      //verify is this blockhash correct?
      const proof: merkleProof = await getMerkleProof(
        blockhash,
        sourceTransactionIndex
      );
      if (!proof) throw new Error("Failed to fetch proofs from api");

      await validateChain();

      if ((await activeNetworkId()) !== networks.ethereum.id) {
        switchNetwork(networks.ethereum.id);
      }

      const receive = await receiveAvail(proof);
      if (receive) {
        Logger.info(
          `AVAIL_TO_ETH_CLAIM_SUCCESS ${receive} claim_to: ${address} amount: ${atomicAmount}`
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
          sourceBlockNumber: 0,
          sourceTransactionIndex: 0,
          sourceTimestamp: sourceTimestamp,
        });
      }
      return receive;
    } catch (e: any) {
      Logger.error(
        `CLAIM FAILED: ${e}`,
        ["receiver_address", receiverAddress],
        ["sender_address", senderAddress],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", "AVAIL -> ETH"]
      );
      throw e;
    }
  };

  const initClaimEthtoAvail = async ({
    executeParams,
    sourceTransactionHash,
    sourceTimestamp,
    atomicAmount,
  }: {
    sourceTransactionHash: `0x${string}`;
    sourceTimestamp: string;
    atomicAmount: string;
    executeParams: {
      messageid: number;
      amount: string | number;
      from: `${string}`;
      to: `${string}`;
      originDomain: number;
      destinationDomain: number;
    };
  }) => {
    try {
      if (!selected) throw new Error("Connect a Avail account");

      let retriedApiConn: ApiPromise | null = null;

      if (!api || !api.isConnected) {
        Logger.debug("Retrying API Conn");
        retriedApiConn = await initApi();
        setApi(retriedApiConn);
        if (!retriedApiConn || !retriedApiConn.isConnected) {
          throw new Error(
            "Uh Oh! RPC under a lot of stress, error intialising api"
          );
        }
      }

      const heads = await refetchHeads();

      if (!heads && ethHead.slot === 0) {
        throw new Error("Failed to fetch heads from api");
      }

      const proofs = await getAccountStorageProofs(
        ethHead.blockHash,
        executeParams.messageid
      );

      if (!proofs) {
        throw new Error("Failed to fetch proofs from api");
      }

      /**
       * @description Execute transaction to finalize/claim a  ETH -> AVAIL transaction on metamask snap
       */
      if (selected.source === "MetamaskSnap") {
        const execute = await snapVectorExecute({
          api: api ? api : retriedApiConn!,
          executeParams: {
            slot: heads.ethHead.slot,
            addrMessage: {
              message: {
                FungibleToken: {
                  assetId: appConfig.assetId as `0x${string}`,
                  amount: executeParams.amount,
                },
              },
              from: `${executeParams.from.padEnd(66, "0")}`,
              to: u8aToHex(decodeAddress(executeParams.to)),
              originDomain: executeParams.originDomain,
              destinationDomain: executeParams.destinationDomain,
              id: executeParams.messageid,
            },
            accountProof: proofs.accountProof,
            storageProof: proofs.storageProof,
          },
        });

        await addToLocalTransaction({
          sourceChain: Chain.ETH,
          destinationChain: Chain.AVAIL,
          sourceTransactionHash: sourceTransactionHash,
          destinationTransactionHash: execute.txHash,
          amount: atomicAmount,
          status: TransactionStatus.CLAIM_PENDING,
          messageId: 0,
          dataType: "ERC20",
          depositorAddress: "",
          receiverAddress: "",
          sourceBlockHash: "0x",
          sourceBlockNumber: 0,
          sourceTransactionIndex: 0,
          sourceTimestamp: sourceTimestamp,
        });

        Logger.info(
          `ETH_TO_AVAIL_CLAIM_SUCCESS ${execute.txHash} claim_to: ${executeParams.to} amount: ${atomicAmount}`
        );
        return execute;
      }

      /**
       * @description Execute transaction to finalize/claim a ETH -> AVAIL transaction on all other substrate based wallets
       */
      const execute = await executeTransaction(
        {
          slot: heads.ethHead.slot,
          addrMessage: {
            message: {
              FungibleToken: {
                assetId: appConfig.assetId as `0x${string}`,
                amount: executeParams.amount,
              },
            },
            from: `${executeParams.from.padEnd(66, "0")}`,
            to: u8aToHex(decodeAddress(executeParams.to)),
            originDomain: executeParams.originDomain,
            destinationDomain: executeParams.destinationDomain,
            id: executeParams.messageid,
          },
          accountProof: proofs.accountProof,
          storageProof: proofs.storageProof,
        },
        selected!,
        api ? api : retriedApiConn!
      );

      addToLocalTransaction({
        sourceChain: Chain.ETH,
        destinationChain: Chain.AVAIL,
        sourceTransactionHash: sourceTransactionHash,
        destinationTransactionHash: execute.txHash,
        amount: atomicAmount,
        status: TransactionStatus.CLAIM_PENDING,
        messageId: 0,
        dataType: "ERC20",
        depositorAddress: "",
        receiverAddress: "",
        sourceBlockHash: "0x",
        sourceBlockNumber: 0,
        sourceTransactionIndex: 0,
        sourceTimestamp: sourceTimestamp,
      });

      Logger.info(
        `ETH_TO_AVAIL_CLAIM_SUCCESS ${execute.txHash} claim_to: ${executeParams.to} amount: ${atomicAmount}`
      );
      return execute;
    } catch (e: any) {
      Logger.error(
        `CLAIM FAILED: ${e}`,
        ["receiver_address", executeParams.to],
        ["sender_address", executeParams.from],
        ["amount", formatUnits(BigInt(atomicAmount), 18)],
        ["flow", "ETH -> AVAIL"]
      );
      throw e;
    }
  };

  return { initClaimAvailToEth, initClaimEthtoAvail };
}

/**
 * Error: ERROR_RECIEVE_AVAIL ContractFunctionExecutionError: The contract function "receiveAVAIL" reverted.

Error: DataRootCommitmentEmpty()
 
Contract Call:
  address:   0x967F7DdC4ec508462231849AE81eeaa68Ad01389
  function:  receiveAVAIL((bytes1 messageType, bytes32 from, bytes32 to, uint32 originDomain, uint32 destinationDomain, bytes data, uint64 messageId), (bytes32[] dataRootProof, bytes32[] leafProof, bytes32 rangeHash, uint256 dataRootIndex, bytes32 blobRoot, bytes32 bridgeRoot, bytes32 leaf, uint256 leafIndex))
  args:                  (["0x02","0xf86aabc41a7238174bbc254d47555ee89e1fa4fe3db0f51d19b1b8849cbcaa59","0xeafdb6af7c1131eec88ef17f1057190a46a6c012000000000000000000000000",1,2,"0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001aa535d3d0c0000","4775501121978369"], [["0x81eeed275d65cea946012743f6c2a85d5884a20dafda59a6db81de4ee0da565d","0xf7d2db80bb9ae1ec94978483993dad405b6459d8c958af1c2ab9880410f720cf","0x51166b11b5e9f685c4e3717bcabdd5eab4e83c5d47a4e95ab8f0c492e04018fa","0x67ebf44e21b0370cc24d56e9c7f0fe43f8cddf3f69e65efdafa3b175bb459535","0x00dde9b01cfa164929c8a0b51adf01d3a0ddb801dbbf45a6e17831f3aea88c55","0xd69564410254311048e1c47c786308a3446a35ec84e1604b2aee4d3202c0141a","0x7ca37a8608fc125a52f7b0392bf41cbee234b57e6c7c9b1884a5e5f4df03170a","0x48ae52d2af2b5774cbf7ccdff3cf6bedfc34b6c272fd34ba35bf91f11c178d25","0x26846476fd5fc54a5d43385167c95144f2643f533cc85bb9d16b782f8d7db193","0x506d86582d252405b840018792cad2bf1259f1ef5aa5f887e13cb2f0094f51e1"],[],"0x2a338ca9b01ebe291ebd9260fda6540c1062b2bad83702c0e3c9539874bf4bf9",202,"0x4ee57cf8bfc1fc7dfa9cee1e31a161428adc5ccf0efbd777e6f3d50943a96563","0x566c653bc7d250e36f3bdb46cca48cecbfd43ac5b46c4032153ef769d9575afd","0x566c653bc7d250e36f3bdb46cca48cecbfd43ac5b46c4032153ef769d9575afd",0])
  sender:    0xEAfDB6af7c1131Eec88Ef17f1057190A46a6C012

Docs: https://viem.sh/docs/contract/simulateContract
Version: viem@2.21.40
 */
