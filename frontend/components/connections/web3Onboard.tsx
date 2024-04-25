import { init } from '@subwallet-connect/react'; 
import subwalletModule from '@subwallet-connect/subwallet'; 
import subwalletPolkadotModule from '@subwallet-connect/subwallet-polkadot'; 
import injectedModule from '@subwallet-connect/injected-wallets'; 
import {TransactionHandlerReturn} from "@subwallet-connect/core/dist/types";
const ws = 'wss://rpc.polkadot.io'; 
 
const injected = injectedModule(); 
const subwalletWallet = subwalletModule(); 
const subwalletPolkadotWalet = subwalletPolkadotModule(); 
 
export default init({ 
    theme: "dark",
    connect : {
        autoConnectLastWallet : true,
        autoConnectAllPreviousWallet : true
      },
  wallets: [injected, subwalletWallet, subwalletPolkadotWalet], 
  chains: [], 
  chainsPolkadot: [ 
    { 
      id: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3', 
      namespace: 'substrate', 
      token: 'DOT', 
      label: 'Polkadot', 
      rpcUrl: `polkadot.api.subscan.io`, 
      decimal: 10 
    } 
  ],
  appMetadata: {
    // The name of your dApp
    name: 'Avail bridge',


    description: 'Demo app for SubWalletConnect V2',
    // The url to a getting started guide for app
    gettingStartedGuide: 'http://mydapp.io/getting-started',
    // url that points to more information about app
    explore: 'http://mydapp.io/about',
    // if your app only supports injected wallets and when no injected wallets detected, recommend the user to install some

    // Optional - but allows for dapps to require users to agree to TOS and privacy policy before connecting a wallet
    agreement: {
      version: '1.0.0',
      termsUrl: 'https://docs.subwallet.app/main/privacy-and-security/terms-of-use',
    }
  },
  notify: {
    desktop: {
      enabled: true,
      transactionHandler: (transaction) :TransactionHandlerReturn => {
        if (transaction.eventCode === 'txConfirmed') {
          return {
            autoDismiss: 0
          }
        }
        // if (transaction.eventCode === 'txPool') {
        //   return {
        //     type: 'hint',
        //     message: 'Your in the pool, hope you brought a towel!',
        //     autoDismiss: 0,
        //     link: `https://goerli.etherscan.io/tx/${transaction.hash}`
        //   }
        // }
      },
      position: 'topCenter'
    }
  }
}); 