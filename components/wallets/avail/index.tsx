"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { getWallets, Wallet, WalletAccount } from "@talismn/connect-wallets";
import { useInvokeSnap, useMetaMask, useRequestSnap } from "@/hooks/metamask";
import { AvailWalletConnect } from 'avail-wallet';
import 'avail-wallet/dist/styles.css';
import { Logger } from '@/utils/logger';
import { useApi } from '@/stores/api';

export default function AvailWalletConnectWrapper() {
  const { api } = useApi();
  
  return (
    <AvailWalletConnect api={api} />
  );
}