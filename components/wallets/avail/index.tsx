"use client";

import React from "react";
import { AvailWalletConnect } from "../../../packages/avail-wallet/src/components/wallets/AvailWalletConnect";
import "../../../packages/avail-wallet/src/styles.css";
import { useApi } from "@/stores/api";

export default function AvailWalletConnectWrapper() {
  const { api } = useApi();

  return <AvailWalletConnect api={api} />;
}
