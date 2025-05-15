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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { InfoIcon, ArrowLeft } from "lucide-react";

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
    clearWalletState,
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
                (account) => account.address === selected?.address,
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
  }, [installedSnap, metamaskInstalled, getSupportedWallets]);

  const handleWalletSelect = useCallback(
    async (wallet: Wallet) => {
      if (wallet.title === "MetamaskSnap") {
        try {
          await requestSnap();
          const address = await invokeSnap({ method: "getAddress" });
          setSelected({ address: address as string, source: "MetamaskSnap" });
          setSelectedWallet({ title: "MetamaskSnap" } as Wallet);
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
    [invokeSnap, requestSnap, setSelected, setSelectedWallet],
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
            if (name === "metadataUpdated") {
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
    [
      selectedWallet,
      api,
      storeApi,
      metadataUpdated,
      setMetadataUpdated,
      setSelected,
    ],
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm" className="!ml-2">
              Connect Wallet
            </Button>
          </DialogTrigger>

          <DialogContent
            style={{
              maxWidth: "425px",
              backgroundColor: "#252831",
              border: "2px solid #3a3b3cb1",
              borderRadius: "0.75rem",
            }}
          >
            <DialogHeader>
              <DialogTitle
                style={{
                  color: "white",
                  fontSize: "2rem",
                  marginBottom: "1rem",
                }}
              >
                Connect Wallet
              </DialogTitle>

              {enabledAccounts.length === 0 ? (
                <>
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
                  <div
                    style={{
                      marginBottom: "1rem",
                    }}
                  />
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
            </DialogHeader>
            <DialogFooter
              style={{
                display: "flex",
                width: "100%",
                marginTop: "0.5rem",
                color: "rgba(255, 255, 255, 0.7)",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>
                {enabledAccounts && enabledAccounts.length > 0 ? (
                  <Button
                    disabled={enabledAccounts.length <= 0}
                    variant={"outline"}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                    onClick={() => {
                      setEnabledAccounts([]);
                      setSelected(null);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                    }}
                  >
                    <ArrowLeft
                      style={{
                        height: "1.75rem",
                        width: "1.75rem",
                        paddingRight: "0.5rem",
                      }}
                    />{" "}
                    <span style={{ fontSize: "1.125rem" }}>
                      Go back to wallets
                    </span>
                  </Button>
                ) : (
                  <p style={{ textAlign: "center" }}>
                    {" "}
                    Scroll to find more wallets{" "}
                  </p>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
