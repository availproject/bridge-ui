"use client";

import React from "react";
import { AvailWalletConnect, AvailWalletProvider } from "avail-wallet";
// import { AvailWalletConnect } from "../../../packages/avail-wallet/src/components/wallets/AvailWalletConnect";
// import { AvailWalletProvider } from "../../../packages/avail-wallet/src/components/wallets/AvailWalletProvider";
import { useApi } from "@/stores/api";

export default function AvailWalletConnectWrapper() {
  const { api } = useApi();

  return (
    <AvailWalletProvider>
      <AvailWalletConnect api={api} />;
    </AvailWalletProvider>
  );
}
