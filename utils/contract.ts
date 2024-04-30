 
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



export async function receiveAvail() {


}
