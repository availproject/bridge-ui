import { toast } from "@/components/ui/use-toast";
import { isNumber } from "@polkadot/util";
import {
  ApiPromise,
  getKeyringFromSeed,
  initialize,
  isValidAddress,
  rpc,
  types,
  TURING_ENDPOINT,
  signedExtensions,
} from "avail-js-sdk";
import { getBalance, writeContract } from "@wagmi/core";
import { apiInstance, indexerInstance } from "./axios-instance";
import { WalletAccount } from "@talismn/connect-wallets";
import { SignerOptions } from "@polkadot/api/types";
import { encodeAbiParameters } from "viem";
import { web3Enable } from "@polkadot/extension-dapp";
import { ethers } from "ethers";
import {
  executeParams,
  merkleProof,
  sendMessageParams,
  TxnData,
} from "@/types/transaction";
import { Chain, ethBalance } from "@/types/common";
import { bridgeContractAbi } from "@/constants/abi";
import { config } from "@/app/providers";

export async function receiveAvail(merkleProof?: merkleProof) {
  try {
    //@ts-ignore TODO: to be fixed later
    const result = await writeContract(config, {
      address: "0x967F7DdC4ec508462231849AE81eeaa68Ad01389",
      abi: bridgeContractAbi,
      functionName: "receiveAVAIL",
      args: [
        [
          "0x02",
          "0x2e30e1a70d7cd4aee8095ad9c7ba8cb0d95a7e58be4a6486094f35461923ea24",
          "0x3942f3a6d7637d9f151b81063a9c5003b278231b000000000000000000000000",
          1,
          2,
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
              "0x0000000000000000000000000000000000000000000000000000000000000000",
              BigInt(100000000000000000),
            ]
          ),
          617100901089281,
        ],
        [
          [
            "0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5",
            "0x211bb859b6c1c838f06f94d2544460919581fb08afe08d1459fdce5db7bf80fb",
            "0xbecc56f4da0595e8cd51de82239c41bbf6790531ba46f56d46bef737c1345977",
            "0x5a021e65ea5c6b76469b68db28c7a390836e22c21c6f95cdef4d3408eb6b8050",
            "0xa1429d3a87eb7256ed951754887563a0d64860c488541a6e9d4fab2687e30658",
            "0x9532fb9b22376d07aa701cc9efeae9e0ec7c8c92a1ed61baba9feb7595be524e",
            "0xe51e1602448430542788cabb952ab87348561d146fe366b2525e581c0530c77e",
            "0x100f7007c87bc44e4a04904ca43b2e435103b4070431af56c78fafd149fc3dc2",
          ],
          [],
          "0x5242c2a2027009c192b4d8abe943200027373b38120c2ca37bfaad67b6ee2fe5",
          39,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0xb744fb54d4d85425a4521f4dfaa6d033bde23f1fd1fa32f6e151a6594d4caffe",
          "0xb744fb54d4d85425a4521f4dfaa6d033bde23f1fd1fa32f6e151a6594d4caffe",
          0,
        ],
      ],
    });
    console.log(result, "result");
  } catch (e) {
    console.log(e);
  }
}
