 
import { toast } from "@/components/ui/use-toast";
import { isNumber } from "@polkadot/util";
import {
  ApiPromise,
  getKeyringFromSeed,
  initialize,
  isValidAddress,
  rpc, types, TURING_ENDPOINT,signedExtensions 
} from "avail-js-sdk";
import { getBalance } from "@wagmi/core";
import { apiInstance, indexerInstance } from "./axios-instance";
import { WalletAccount } from "@talismn/connect-wallets";
import { SignerOptions } from "@polkadot/api/types";
import { encodeAbiParameters } from 'viem'
import { web3Enable } from "@polkadot/extension-dapp";
import { executeParams, merkleProof, sendMessageParams, TxnData } from "@/types/transaction";
import { Chain, ethBalance } from "@/types/common";

export async function fetchMerkleProof(blockhash: `0x${string}`, index: number) : Promise<merkleProof> {
  const response = await apiInstance
    .get(`/eth/proof/${blockhash}`,{
      params: {
        index,
      },
    })
    .catch((e) => {
      console.log(e);
      return { data: [] };
    });

  console.log(response.data, "response.data")
  const result: merkleProof = response.data;
  return result;

}
