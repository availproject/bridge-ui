import {
  getWalletBySource,
  getWallets,
  Wallet,
  WalletAccount,
} from "@talismn/connect-wallets";
import { ApiPromise } from "avail-js-sdk";
import { ArrowLeft, InfoIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/Dialog";
import {
  useInvokeSnap,
  useMetaMask,
  useRequestSnap,
} from "../../hooks/metamask";
import { useApi } from "../../stores/api";
import { useAvailAccount } from "../../stores/availwallet";
import {
  AvailWalletConnectProps,
  ExtendedWalletAccount,
  UpdateMetadataParams,
} from "../../types";
import AccountSelector from "./AccountSelector";
import DisconnectWallet from "./DisconnectWallet";
import WalletSelector from "./WalletSelector";

const AvailWalletConnect = ({ api }: AvailWalletConnectProps) => {
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
          (account) => account.type !== "ethereum"
        );
        setEnabledAccounts(substrateAccounts);
      }
    },
    [invokeSnap, requestSnap, setSelected, setSelectedWallet]
  );

  const getInjectorMetadata = (api: ApiPromise) => {
    return {
      chain: api.runtimeChain.toString(),
      specVersion: api.runtimeVersion.specVersion.toNumber(),
      tokenDecimals: api.registry.chainDecimals[0] || 18,
      tokenSymbol: api.registry.chainTokens[0] || "AVAIL",
      genesisHash: api.genesisHash.toHex(),
      ss58Format:
        typeof api.registry.chainSS58 === "number" ? api.registry.chainSS58 : 0,
      chainType: "substrate" as const,
      icon: "substrate",
      types: {},
      userExtensions: [],
    };
  };

  const updateMetadata = async ({
    api,
    account,
    metadataCookie,
    selectedWallet,
    setCookie,
  }: UpdateMetadataParams) => {
    const injector = getWalletBySource(account.source);

    // const retriedApiConn: ApiPromise | null = null;
    // const showError: Function | null = null;

    if (!api || !api.isConnected || !(await api.isReady)) {
      console.debug("API not ready, cannot update metadata");
      return;
    }

    if (
      injector &&
      (!metadataCookie ||
        (metadataCookie
          ? metadataCookie.wallet !== selectedWallet.title
          : true))
    ) {
      try {
        const metadata = getInjectorMetadata(api);
        await injector.extension.metadata.provide(metadata);
        setCookie(
          "metadataUpdated",
          {
            wallet: selectedWallet.title,
            updated: true,
          },
          {}
        );
      } catch (e) {
        console.error("Failed to update metadata", e);
      }
    }
  };

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
          setCookie: (name: string, value: any) => {
            if (name === "metadataUpdated") {
              setMetadataUpdated(value);
            }
          },
        });
      }

      setOpen(false);
      console.info(
        `AVAIL_WALLET_CONNECT - ${selectedWallet?.title} - ${account.address}`
      );
    },
    [
      selectedWallet,
      api,
      storeApi,
      metadataUpdated,
      setMetadataUpdated,
      setSelected,
    ]
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

export default AvailWalletConnect;
