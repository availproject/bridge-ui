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
import { substrateConfig, ethConfig } from "@/config";
import { getBalance, writeContract } from "@wagmi/core";
import { apiInstance, indexerInstance } from "./axios-instance";
import { WalletAccount } from "@talismn/connect-wallets";
import { SignerOptions } from "@polkadot/api/types";
import { encodeAbiParameters } from "viem";
import { web3Enable } from "@polkadot/extension-dapp";
import { sepolia } from "wagmi/chains";
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
      address: "0x1369A4C9391cF90D393b40fAeAD521b0F7019dc5",
      abi: bridgeContractAbi,
      functionName: "receiveAVAIL",
      args: [
        [
          "0x02",
          "0x14a1696bc3267feb4c3d3e9164525d6b70feca07e4ef0d3e4bc05b3ce27c7a27",
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          1,
          2,
          "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e8",
          221469988618241,
      ],
        [
          [
            "0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5",
            "0x51f84e7279cdf6acb81af77aec64f618f71029b7d9c6d37c035c37134e517af2",
            "0x69c8458dd62d27ea9abd40586ce53e5220d43b626c27f76468a57e94347f0d6b",
            "0xeee11b7e806b788986b4f11846e195fa176141096ed72a9993f4aa366f4737d5",
            "0xa1429d3a87eb7256ed951754887563a0d64860c488541a6e9d4fab2687e30658",
            "0x7354bb05e08941b4f0ed170de8a2d1c3bb3be1321e7dfd2589df60f33bff5602",
            "0xd88ddfeed400a8755596b21942c1497e114c302e6118290f91e6772976041fa1",
            "0x87eb0ddba57e35f6d286673802a4af5975e22506c7cf4c64bb6be5ee11527f2c",
          ],
          [],
          "0xf478ccaa7ab33097e71b072dcdf03e06371d166799f7f0cb027fe7e57e7705d6",
          54,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x50dbb13211d414b9eb91f4dc06fbc44d7f605be60acc5386f3c9075de56556a0",
          "0x50dbb13211d414b9eb91f4dc06fbc44d7f605be60acc5386f3c9075de56556a0",
          0,
        ],
      ],
    });
    console.log(result, "result");
  } catch (e) {
    console.log(e);
  }
}

