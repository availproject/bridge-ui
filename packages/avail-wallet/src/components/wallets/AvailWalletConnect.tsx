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

export const AvailWalletConnect: React.FC<AvailWalletConnectProps> = ({
  api,
}) => {
  const [open, setOpen] = useState(false);
  const [supportedWallets, setSupportedWallets] = useState<Wallet[]>([]);
  const [enabledAccounts, setEnabledAccounts] = useState<WalletAccount[]>([]);
  const [cookies, setCookie] = useState<{
    substrateAddress?: string;
    substrateWallet?: string;
    metadataUpdated?: any;
  }>({});

  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();

  const { selected, setSelected, selectedWallet, setSelectedWallet } =
    useAvailAccount();

  const { installedSnap, metamaskInstalled } = useMetaMask();

  const getSupportedWallets = useCallback(() => {
    const wallets = getWallets();
    setSupportedWallets(wallets);
    return wallets;
  }, []);

  useEffect(() => {
    (async () => {
      const wallets = getSupportedWallets();

      if (cookies.substrateAddress && cookies.substrateWallet) {
        if (cookies.substrateWallet === "MetamaskSnap" && installedSnap) {
          setSelected({
            address: cookies.substrateAddress as string,
            source: "MetamaskSnap",
          });
        } else {
          const selectedWallet = wallets.find((wallet) => {
            return wallet.title === cookies.substrateWallet;
          });

          if (!selectedWallet) {
            return;
          }

          (selectedWallet.enable("avail-wallet") as any).then(() => {
            selectedWallet.getAccounts().then((accounts: WalletAccount[]) => {
              const enabledAccounts = (
                accounts as ExtendedWalletAccount[]
              ).filter((account) => {
                return account.type !== "ethereum";
              });
              const selected = enabledAccounts.find(
                (account) => account.address === cookies.substrateAddress,
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
  }, [
    cookies.substrateAddress,
    cookies.substrateWallet,
    installedSnap,
    metamaskInstalled,
    getSupportedWallets,
    setSelected,
    setSelectedWallet,
  ]);

  const handleWalletSelect = useCallback(
    async (wallet: Wallet) => {
      if (wallet.title === "MetamaskSnap") {
        try {
          await requestSnap();
          const address = await invokeSnap({ method: "getAddress" });
          setSelected({ address: address as string, source: "MetamaskSnap" });
          setCookie({
            ...cookies,
            substrateAddress: address as string,
            substrateWallet: "MetamaskSnap",
          });
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
      cookies,
      setCookie,
      setSelected,
      setSelectedWallet,
    ],
  );

  const handleAccountSelect = useCallback(
    async (account: WalletAccount) => {
      setSelected(account);
      setCookie({
        ...cookies,
        substrateAddress: account.address,
        substrateWallet: selectedWallet?.title,
      });

      if (api && selectedWallet) {
        await updateMetadata({
          api,
          account,
          metadataCookie: cookies.metadataUpdated,
          selectedWallet: selectedWallet,
          setCookie: (name: string, value: any, options: any) => {
            setCookie({
              ...cookies,
              [name]: value,
            });
          },
        });
      }

      setOpen(false);
      console.info(
        `AVAIL_WALLET_CONNECT - ${selectedWallet?.title} - ${account.address}`,
      );
    },
    [selectedWallet, api, cookies, setCookie, setSelected],
  );

  const handleDisconnect = useCallback(() => {
    setCookie({});
    setSelected(null);
    setSelectedWallet(null);
    setEnabledAccounts([]);
  }, [setCookie, setSelected, setSelectedWallet]);

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
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 !ml-2"
          >
            Connect Wallet
          </button>

          {open && (
            <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
              <div
                className="fixed inset-0 bg-black/50"
                onClick={() => setOpen(false)}
              ></div>
              <div className="z-50 grid w-full max-w-lg gap-4 bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full">
                <div className="sm:max-w-[425px] bg-[#252831] border-2 border-[#3a3b3cb1] rounded-xl p-4">
                  <div>
                    <h2 className="font-bold text-3xl text-white">
                      Connect Wallet
                    </h2>

                    {enabledAccounts.length === 0 ? (
                      <>
                        <p className="font-regular text-md text-white text-opacity-70 pt-2">
                          <div className="flex flex-row items-start justify-start pt-3 space-x-2">
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
                                className="underline"
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
                          className="!bg-[#252831] hover:text-white !border-0 !p-0"
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
                            className="h-7 w-7 pr-2 inline-block"
                          >
                            <path d="m12 19-7-7 7-7" />
                            <path d="M19 12H5" />
                          </svg>
                          <span className="text-lg">Go back to wallets</span>
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
