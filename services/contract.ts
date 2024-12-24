import { readContract } from '@wagmi/core'
import { config } from '@/config/walletConfig'
import { appConfig } from '@/config/default'
import availTokenAbi from '@/constants/abis/availTokenAbi.json'
import { Chain } from '@/types/common'
import { parseAmount, parseAvailAmount } from '@/utils/parsers'
import { ApiPromise } from 'avail-js-sdk'
import { validAddress } from '@/utils/common'

const contractAddresses = {
  [Chain.ETH]: appConfig.contracts.ethereum.availToken,
  [Chain.BASE]: appConfig.contracts.base.availToken
} as const

const chainIds = {
  [Chain.ETH]: appConfig.networks.ethereum.id,
  [Chain.BASE]: appConfig.networks.base.id
} as const

export async function getTokenBalance(chain: Chain, address: string, api?: ApiPromise) {

  if(!validAddress(address, chain)) throw new Error("Invalid Recipient on base")

  if (chain === Chain.AVAIL) {
    if (api) {
        const balance: any= await api.query.system.account(address)
        return parseAvailAmount(balance["data"]["free"].toHuman(), 18)
      } 
      throw new Error("API not connected")  
  }

  return readContract(config, {
    address: contractAddresses[chain] as `0x${string}`,
    abi: availTokenAbi,
    functionName: "balanceOf",
    args: [address],
    chainId: chainIds[chain],
    }).then(balance => parseAmount(balance as string, 18))
}

