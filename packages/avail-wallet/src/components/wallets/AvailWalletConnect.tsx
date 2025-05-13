import React, { useState, useCallback, useEffect } from "react";
import { getWallets, Wallet, WalletAccount } from "@talismn/connect-wallets";
import {
  useInvokeSnap,
  useMetaMask,
  useRequestSnap,
} from "../../hooks/metamask";
import { DisconnectWallet } from "./DisconnectWallet";
import { AccountSelector } from "./AccountSelector";
import { updateMetadata } from "../../utils";
import { WalletSelector } from "./WalletSelector";
import { AvailWalletConnectProps, ExtendedWalletAccount } from "../../types";
import { useAvailAccount } from "../../stores/availwallet";
import { useApi } from "../../stores/api";

export const AvailWalletConnect: React.FC<AvailWalletConnectProps> = ({
  api,
}) => {
  const [open, setOpen] = useState(false);
  const [supportedWallets, setSupportedWallets] = useState<Wallet[]>([]);
  const [enabledAccounts, setEnabledAccounts] = useState<WalletAccount[]>([]);
  const { api: storeApi } = useApi();

  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();

  const { 
    selected, 
    setSelected, 
    selectedWallet, 
    setSelectedWallet,
    metadataUpdated,
    setMetadataUpdated,
    clearWalletState
  } = useAvailAccount();

  const { installedSnap, metamaskInstalled } = useMetaMask();

  const getSupportedWallets = useCallback(() => {
    const wallets = getWallets();
    setSupportedWallets(wallets);
    return wallets;
  }, []);

  useEffect(() => {
    (async () => {
      const wallets = getSupportedWallets();
  
      if (selected?.address && selectedWallet?.title) {
        if (selectedWallet.title === "MetamaskSnap" && installedSnap) {
          // Reconnect is handled by persistent state
        } else {
          const matchedWallet = wallets.find((wallet) => {
            return wallet.title === selectedWallet?.title;
          });
  
          if (!matchedWallet) {
            return;
          }
  
          (matchedWallet.enable("bridge-ui") as any).then(() => {
            matchedWallet.getAccounts().then((accounts: WalletAccount[]) => {
              const enabledAccounts = (
                accounts as ExtendedWalletAccount[]
              ).filter((account) => {
                return account.type! !== "ethereum";
              });
              const selectedAccount = enabledAccounts.find(
                (account) => account.address === selected?.address
              );
  
              if (!selectedAccount) {
                return;
              }
  
              setEnabledAccounts(enabledAccounts);
            });
          });
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    installedSnap,
    metamaskInstalled,
    getSupportedWallets
  ]);

  const handleWalletSelect = useCallback(
    async (wallet: Wallet) => {
      if (wallet.title === "MetamaskSnap") {
        try {
          await requestSnap();
          const address = await invokeSnap({ method: "getAddress" });
          setSelected({ address: address as string, source: "MetamaskSnap" });
          setSelectedWallet({ title: 'MetamaskSnap' } as Wallet);
        } catch (error) {
          console.error("Failed to connect to Avail Snap", error);
        }
      } else {
        setSelectedWallet(wallet);
        await wallet.enable("avail-wallet");
        const accounts = await wallet.getAccounts();
        const substrateAccounts = accounts.filter(
          //@ts-expect-error - type is not defined in the WalletAccount interface but it exists
          (account) => account.type !== "ethereum",
        );
        setEnabledAccounts(substrateAccounts);
      }
    },
    [
      invokeSnap,
      requestSnap,
      setSelected,
      setSelectedWallet,
    ],
  );

  const handleAccountSelect = useCallback(
    async (account: WalletAccount) => {
      setSelected(account);

      const currentApi = api || storeApi;
      if (currentApi && selectedWallet) {
        await updateMetadata({
          api: currentApi,
          account,
          metadataCookie: metadataUpdated,
          selectedWallet: selectedWallet,
          setCookie: (name: string, value: any, options: any) => {
            if (name === 'metadataUpdated') {
              setMetadataUpdated(value);
            }
          },
        });
      }

      setOpen(false);
      console.info(
        `AVAIL_WALLET_CONNECT - ${selectedWallet?.title} - ${account.address}`,
      );
    },
    [selectedWallet, api, storeApi, metadataUpdated, setMetadataUpdated, setSelected],
  );

  const handleDisconnect = useCallback(() => {
    clearWalletState();
    setEnabledAccounts([]);
  }, [clearWalletState]);

  return (
    <>
      {selected ? (
        <DisconnectWallet
          selected={selected}
          installedSnap={installedSnap}
          onDisconnect={handleDisconnect}
        />
      ) : (
        <div>
          <button
            onClick={() => setOpen(!open)}
            className="aw-button aw-button-primary aw-ml-2"
          >
            Connect Wallet
          </button>

          {open && (
            <div className="aw-dialog-overlay">
              <div
                className="fixed inset-0 bg-black/50"
                onClick={() => setOpen(false)}
              ></div>
              <div className="aw-dialog-content">
                <div className="aw-bg-dark aw-border-2 aw-border-darker aw-rounded-xl p-4">
                  <div>
                    <h2 className="aw-font-bold aw-text-3xl aw-text-white">
                      Connect Wallet
                    </h2>

                    {enabledAccounts.length === 0 ? (
                      <>
                        <p className="aw-text-md aw-text-white aw-text-opacity-70 aw-pt-2">
                          <div className="aw-flex-row aw-items-start aw-justify-start aw-pt-3 aw-space-x-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <span>
                              Don&apos;t have an Avail Wallet yet? Checkout this{" "}
                              <a
                                href="https://docs.availspace.app/avail-space/web-dashboard-user-guide/getting-started/how-to-install-subwallet-and-create-a-new-avail-account?utm_source=avail&utm_medium=docspace&utm_campaign=avlclaim"
                                className="aw-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                cool tutorial
                              </a>{" "}
                              by Subwallet.
                            </span>
                          </div>
                        </p>
                        <div className="pb-3" />
                        <WalletSelector
                          supportedWallets={supportedWallets}
                          onWalletSelect={handleWalletSelect}
                          metamaskInstalled={metamaskInstalled}
                        />
                      </>
                    ) : (
                      <AccountSelector
                        selectedWallet={selectedWallet}
                        enabledAccounts={enabledAccounts}
                        onAccountSelect={handleAccountSelect}
                      />
                    )}
                  </div>
                  <div className="flex w-full mt-2 text-white text-opacity-70 !flex-col !items-center !justify-center">
                    <div>
                      {enabledAccounts && enabledAccounts.length > 0 ? (
                        <button
                          disabled={enabledAccounts.length <= 0}
                          className="aw-bg-dark aw-button aw-button-outline"
                          onClick={() => {
                            setEnabledAccounts([]);
                            setSelected(null);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="aw-h-7 aw-w-7 aw-pr-2 inline-block"
                          >
                            <path d="m12 19-7-7 7-7" />
                            <path d="M19 12H5" />
                          </svg>
                          <span className="aw-text-lg">Go back to wallets</span>
                        </button>
                      ) : (
                        <p>Scroll to find more wallets</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
