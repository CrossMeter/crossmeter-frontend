import { createConfig, http } from 'wagmi';
import { sepolia, avalancheFuji } from 'wagmi/chains';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';

export const wagmiConfig = createConfig({
  chains: [sepolia, avalancheFuji],
  multiInjectedProviderDiscovery: false,
  connectors: [
    (config) => DynamicWagmiConnector({
      config,
      // Dynamic will handle all wallet connections
    }),
  ],
  transports: {
    [sepolia.id]: http(),
    [avalancheFuji.id]: http(),
  },
});