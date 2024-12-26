import {
  Chain,
  Network,
  SignAndSendSigner,
  UnsignedTransaction,
  TxHash,
} from "@wormhole-foundation/sdk";
import { WalletClient } from "viem";

export class WagmiWormholeSigner implements SignAndSendSigner<Network, Chain> {
  private walletClient: WalletClient;
  private chainName: Chain;
  private _address: string;

  private constructor(
    walletClient: WalletClient,
    chainName: Chain,
    address: string
  ) {
    this.walletClient = walletClient;
    this.chainName = chainName;
    this._address = address;
  }

  static async create(
    walletClient: WalletClient,
    chainName: Chain
  ): Promise<WagmiWormholeSigner> {
    const [address] = await walletClient.getAddresses();
    return new WagmiWormholeSigner(walletClient, chainName, address);
  }

  chain(): Chain {
    return this.chainName;
  }

  address(): string {
    return this._address;
  }

  async signAndSend(
    txs: UnsignedTransaction<Network, Chain>[]
  ): Promise<TxHash[]> {
    const results: TxHash[] = [];

    for (const tx of txs) {
      const hash = await this.walletClient.sendTransaction({
        ...tx.transaction,
        account: this._address as `0x${string}`,
        chain: this.walletClient.chain,
      });

      results.push(hash as TxHash);
    }

    return results;
  }
}
