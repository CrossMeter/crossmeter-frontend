'use client';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { SolanaWalletConnectors } from '@dynamic-labs/solana';
import { useEffect, useRef } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { vendorStatusApi } from "@/lib/api";

export function DynamicProvider({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        walletConnectors: [EthereumWalletConnectors, SolanaWalletConnectors],
        initialAuthenticationMode: 'connect-only',
        appName: 'PIaaS Dashboard',
        appLogoUrl: '/your-logo.png',
        privacyPolicyUrl: '/privacy',
        termsOfServiceUrl: '/terms',
      }}
    >
      <WalletConnectionWatcher />
      {children}
    </DynamicContextProvider>
  );
}

function WalletConnectionWatcher() {
  const { primaryWallet, user } = useDynamicContext();
  const processedWallets = useRef(new Set<string>());

  useEffect(() => {
    const handleWalletConnection = async (walletAddress: string) => {
      // Avoid processing the same wallet multiple times
      if (processedWallets.current.has(walletAddress)) {
        return;
      }

      processedWallets.current.add(walletAddress);
      
      try {
        console.log('🔥 Processing wallet connection for:', walletAddress);
        await vendorStatusApi.createUserOnWalletConnect(walletAddress);
        console.log('✅ User created in database for wallet:', walletAddress);
      } catch (error) {
        console.error('❌ Failed to create user in database:', error);
        // Remove from processed set so we can retry
        processedWallets.current.delete(walletAddress);
      }
    };

    // Only check primary wallet - this is the most reliable approach
    if (primaryWallet?.address) {
      console.log('🔍 Primary wallet detected:', primaryWallet.address);
      handleWalletConnection(primaryWallet.address);
    }
  }, [primaryWallet?.address]);

  return null;
}
// Alternative: Custom hook for easier integration
export function useWalletConnection() {
  const { primaryWallet, user } = useDynamicContext();
  const processedWallets = useRef(new Set<string>());

  const processWallet = async (walletAddress: string) => {
    if (processedWallets.current.has(walletAddress)) {
      return;
    }

    processedWallets.current.add(walletAddress);
    
    try {
      console.log('🔥 Processing wallet connection for:', walletAddress);
      await vendorStatusApi.createUserOnWalletConnect(walletAddress);
      console.log('✅ User created in database for wallet:', walletAddress);
      return true;
    } catch (error) {
      console.error('❌ Failed to create user in database:', error);
      processedWallets.current.delete(walletAddress);
      return false;
    }
  };

  useEffect(() => {
    if (primaryWallet?.address) {
      processWallet(primaryWallet.address);
    }
  }, [primaryWallet?.address]);

  return {
    primaryWallet,
    user,
    processWallet,
    isWalletProcessed: (address: string) => processedWallets.current.has(address)
  };
}
