"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { getWallets, Wallet, WalletAccount } from "@talismn/connect-wallets";
import { useCookies } from "react-cookie";
import { useAvailAccount } from "@/stores/availWalletHook";
import { useInvokeSnap, useMetaMask, useRequestSnap } from "@/hooks/Metamask";
import { DisconnectWallet } from './disconnectWallet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AccountSelector } from './accountSelector';
import { updateMetadata } from './utils';
import { WalletSelector } from './walletSelector';
import { ArrowLeft, InfoIcon } from 'lucide-react';
import { useCommonStore } from '@/stores/common';
import { showFailedMessage } from '@/utils/toasts';
import { ExtendedWalletAccount } from './types';
import { Logger } from '@/utils/logger';

export default function AvailWalletConnect() {
  const [open, setOpen] = useState(false);
  const [supportedWallets, setSupportedWallets] = useState<Wallet[]>([]);
  const [enabledAccounts, setEnabledAccounts] = useState<WalletAccount[]>([]);
  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();
  
  const [cookie, setCookie, removeCookie] = useCookies([
    "substrateAddress", 
    "substrateWallet", 
    "metadataUpdated"
  ]);
  
  const { 
    selected, 
    setSelected, 
    selectedWallet, 
    setSelectedWallet 
  } = useAvailAccount();
  
  const { installedSnap, detectMetaMask } = useMetaMask();
  const { api } = useCommonStore();

  const getSupportedWallets = useCallback(() => {
    const wallets = getWallets();
    setSupportedWallets(wallets);
    return wallets;
  }, []);

  useEffect(() => {
    (async () => {
      const wallets = getSupportedWallets();
  
      if (cookie.substrateAddress && cookie.substrateWallet) {
        if (cookie.substrateWallet === "MetamaskSnap" && installedSnap) {
          setSelected({
            address: cookie.substrateAddress as string,
            source: "MetamaskSnap",
          });
        } else {
          const selectedWallet = wallets.find((wallet) => {
            return wallet.title == cookie.substrateWallet;
          });
  
          if (!selectedWallet) {
            return;
          }
  
          (selectedWallet.enable("bridge-ui") as any).then(() => {
            selectedWallet.getAccounts().then((accounts: WalletAccount[]) => {
              const enabledAccounts = (
                accounts as ExtendedWalletAccount[]
              ).filter((account) => {
                return account.type! !== "ethereum";
              });
              const selected = enabledAccounts.find(
                (account) => account.address == cookie.substrateAddress
              );
  
              if (!selected) {
                return;
              }
  
              setSelectedWallet(selectedWallet);
              setEnabledAccounts(enabledAccounts);
              setSelected(selected);
            });
          });
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cookie.substrateAddress, 
    cookie.substrateWallet, 
    installedSnap,
    getSupportedWallets
  ]);

  
  const handleWalletSelect = useCallback(async (wallet: Wallet) => {
    if (wallet.title === 'Avail Snap') {
      try{
        await requestSnap();
        const address = await invokeSnap({ method: "getAddress" });
        setSelected({ address: address as string, source: "MetamaskSnap" });
        setCookie("substrateAddress", address, { path: "/", sameSite: true });
        setCookie("substrateWallet", "MetamaskSnap", { path: "/", sameSite: true });
      } catch (error) {
        showFailedMessage({
          title: "Failed to connect to Avail Snap, please try again later.",
        })
        console.error("Failed to connect to Avail Snap", error);
      }
    } else {
      setSelectedWallet(wallet);
      await wallet.enable("bridge-ui");
      const accounts = await wallet.getAccounts();
      //@ts-expect-error - type is not defined in the WalletAccount interface but it exists
      const substrateAccounts = accounts.filter(account => account.type !== "ethereum");
      setEnabledAccounts(substrateAccounts);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccountSelect = useCallback(async (account: WalletAccount) => {
    setSelected(account);
    setCookie("substrateAddress", account.address, { path: "/", sameSite: true });
    setCookie("substrateWallet", selectedWallet?.title, { path: "/", sameSite: true });
    await updateMetadata({
      api: api,
      account,
      metadataCookie: cookie.metadataUpdated,
      selectedWallet: selectedWallet!,
      setCookie,
    })
    setOpen(false);
    Logger.info(`AVAIL_WALLET_CONNNECT - ${selectedWallet?.title} - ${account.address}`,);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWallet]);


  const handleDisconnect = useCallback(() => {
    removeCookie("substrateAddress");
    removeCookie("substrateWallet");
    setSelected(null);
    setSelectedWallet(null);
    setEnabledAccounts([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {selected ? (
        <DisconnectWallet 
          selected={selected} 
          installedSnap={installedSnap} 
          onDisconnect={handleDisconnect} 
        />
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm" className="!ml-2">
              Connect Wallet
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[425px] bg-[#252831] border-2 border-[#3a3b3cb1] rounded-xl">
            <DialogHeader>
              <DialogTitle className="font-thicccboibold text-3xl text-white">
                Connect Wallet
              </DialogTitle>
              
              {enabledAccounts.length === 0 ? ( <>
                <DialogDescription className="font-thicccboiregular text-md text-white text-opacity-70 pt-2">
                <div className="flex flex-row font-ppmori items-start justify-start pt-3 space-x-2">
                  <InfoIcon />
                  <span>
                    Don&apos;t have an Avail Wallet yet? Checkout this{" "}
                    <a
                      href="https://docs.availspace.app/avail-space/web-dashboard-user-guide/getting-started/how-to-install-subwallet-and-create-a-new-avail-account?utm_source=avail&utm_medium=docspace&utm_campaign=avlclaim"
                      className="underline"
                      target="_blank"
                    >
                      cool tutorial
                    </a>{" "}
                    by Subwallet.
                  </span>
                </div>
              </DialogDescription>
              <div className='pb-3'/>
                <WalletSelector 
                  supportedWallets={supportedWallets} 
                  onWalletSelect={handleWalletSelect}
                  detectMetaMask={detectMetaMask()}
                />
                </>
              ) : (
                <AccountSelector 
                  selectedWallet={selectedWallet}
                  enabledAccounts={enabledAccounts}
                  onAccountSelect={handleAccountSelect}
                />
              )}
            </DialogHeader>
            <DialogFooter className="flex w-full mt-2 text-white text-opacity-70 font-ppmori font-light !flex-col !items-center !justify-center">
                <div>
                  {enabledAccounts && enabledAccounts.length > 0
                    ? 
                      <Button
                        disabled={enabledAccounts.length <= 0}
                        variant={"outline"}
                        className="!bg-[#252831] hover:text-white !border-0 !p-0 "
                        onClick={() => {
                          setEnabledAccounts([]);
                          setSelected(null);
                        }}
                      >
                      <ArrowLeft className='h-7 w-7 pr-2'/> <span className='text-lg'>Go back to wallets</span>
                      </Button>
    
                    :  <p> Scroll to find more{" "} wallets </p>}
               </div>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}