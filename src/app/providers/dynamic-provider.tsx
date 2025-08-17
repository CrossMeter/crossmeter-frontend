'use client';

import { DynamicContextProvider, DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { SolanaWalletConnectors } from '@dynamic-labs/solana';

export function DynamicProvider({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        walletConnectors: [EthereumWalletConnectors, SolanaWalletConnectors],
        
        // Customization options
        appName: 'Your App Name',
        appLogoUrl: '/your-logo.png',
        
        // Theme customization
        cssOverrides: `
          .dynamic-widget-card {
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
        `,
        
        // Event handlers
        events: {
          onAuthSuccess: (args) => {
            console.log('Auth success:', args);
            // Handle successful authentication
          },
          onLogout: (args) => {
            console.log('Logout:', args);
            // Handle logout
          },
          onAuthFailure: (args) => {
            console.log('Auth failure:', args);
            // Handle authentication failure
          },
        },
        
        // Privacy and legal
        privacyPolicyUrl: '/privacy',
        termsOfServiceUrl: '/terms',
        
        // Initial authentication mode
        initialAuthenticationMode: 'connect-only', // or 'connect-and-sign'
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}