 
import { toast } from "@/components/ui/use-toast";
import { isNumber } from "@polkadot/util";
import {
  ApiPromise,
  getKeyringFromSeed,
  initialize,
  isValidAddress,
  rpc, types, TURING_ENDPOINT,signedExtensions 
} from "avail-js-sdk";
import { substrateConfig, ethConfig } from "@/config";
import { getBalance } from "@wagmi/core";
import { apiInstance, indexerInstance } from "./axios-instance";
import { WalletAccount } from "@talismn/connect-wallets";
import { SignerOptions } from "@polkadot/api/types";
import { encodeAbiParameters } from 'viem'
import { web3Enable } from "@polkadot/extension-dapp";
import { sepolia } from "wagmi/chains";
import { executeParams, sendMessageParams, TxnData } from "@/types/transaction";
import { Chain, ethBalance } from "@/types/common";

export async function fetchMerkleProof(blockhash: `0x${string}`) : Promise<string> {
  const response = await apiInstance
    .get(`/eth/proof`,{ params :{
      blockhash: blockhash
    }
    })
    .catch((e) => {
      console.log(e);
      return { data: { result: [] } };
    });

  const result: string = response.data.result;
  return result;

}
