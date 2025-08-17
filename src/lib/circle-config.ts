import type { CircleChainConfig } from './types';

export const CIRCLE_CHAINS: Record<string, CircleChainConfig> = {
  ethereum: {
    chainId: 11155111, // Sepolia Testnet
    name: "Ethereum Sepolia",
    messageTransmitterAddress: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    blockExplorer: "https://sepolia.etherscan.io"
  },
  avalanche: {
    chainId: 43113, // Fuji Testnet
    name: "Avalanche Fuji",
    messageTransmitterAddress: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    blockExplorer: "https://testnet.snowtrace.io"
  }
};

export const MESSAGE_TRANSMITTER_ABI = [
  {
    type: "function",
    name: "receiveMessage",
    inputs: [
      { name: "message", type: "bytes", internalType: "bytes" },
      { name: "attestation", type: "bytes", internalType: "bytes" }
    ],
    outputs: [{ name: "success", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable"
  }
] as const;

export const getChainConfig = (chainName: string): CircleChainConfig | null => {
  return CIRCLE_CHAINS[chainName] || null;
};

export const getChainNameFromId = (chainId: number): string | null => {
  for (const [name, config] of Object.entries(CIRCLE_CHAINS)) {
    if (config.chainId === chainId) {
      return name;
    }
  }
  return null;
};