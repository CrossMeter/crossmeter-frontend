"use client";

import { useEffect } from "react";
import { useDynamicContext, useIsLoggedIn, useUserWallets } from '@dynamic-labs/sdk-react-core';
import { vendorStatusApi } from "@/lib/api";

export function useWalletUserCreation() {
  const { user } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const userWallets = useUserWallets();

  useEffect(() => {
    if (isLoggedIn && user && userWallets.length > 0) {
      const walletAddress = userWallets[0].address;
      console.warn('🎉 WALLET CONNECTED:', walletAddress, 'at', new Date().toLocaleTimeString());
    }
  }, [isLoggedIn, user, userWallets]);
}
