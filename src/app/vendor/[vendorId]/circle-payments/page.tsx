"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CircleDot,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
  Wallet,
  User
} from "lucide-react";
import { vendorApi, circleApi } from "@/lib/api";
import { CircleAttestationsTable } from "@/components/CircleAttestationsTable";
import type { Vendor, AttestationData } from "@/lib/types";
import { CIRCLE_CHAINS, MESSAGE_TRANSMITTER_ABI, getChainConfig } from "@/lib/circle-config";

import { useWriteContract, useSwitchChain, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useToast } from '@/contexts/ToastContext';

export default function CirclePaymentsPage() {
  const params = useParams();
  const vendorId = params.vendorId as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic wallet connection
  const { setShowAuthFlow, primaryWallet, isAuthenticated } = useDynamicContext();
  
  // Wagmi hooks for blockchain interactions
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const [txHash, setTxHash] = useState<string | null>(null);
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });
  
  // Toast notifications
  const { addToast } = useToast();

  const loadVendor = async () => {
    try {
      setLoading(true);
      setError(null);
      const vendorRes = await vendorApi.get(vendorId);
      setVendor(vendorRes.data);
    } catch (error) {
      console.error("Failed to load vendor:", error);
      setError("Failed to load vendor data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendor();
  }, [vendorId]);

  const handleConnectWallet = () => {
    setShowAuthFlow(true);
  };

  const handleMint = async (attestation: AttestationData) => {
    try {
      if (!vendor) {
        throw new Error("Vendor data not available");
      }

      if (!isConnected || !address) {
        addToast({
          title: "Wallet not connected",
          description: "Please connect your wallet first",
          variant: "destructive"
        });
        setShowAuthFlow(true);
        return;
      }

      addToast({
        title: "Starting mint process",
        description: `Minting $${(attestation.amount / 1000000).toFixed(2)} USDC`,
        variant: "default"
      });

      // 1. Update status to 'minting'
      await circleApi.updateAttestationStatus({
        attestationId: attestation.id,
        status: 'minting'
      });

      // 2. Get destination chain config
      const destChain = getChainConfig('avalanche');
      if (!destChain) {
        throw new Error(`Unsupported destination chain: ${attestation.destinationChain}`);
      }

      // 3. Switch to destination chain
      console.log('Switching to chain:', destChain.chainId);
      addToast({
        title: "Switching networks",
        description: `Please switch to ${destChain.name}`,
        variant: "default"
      });
      await switchChain({ chainId: destChain.chainId });

      // 4. Call receiveMessage on MessageTransmitter
      console.log('Calling receiveMessage with:', {
        address: destChain.messageTransmitterAddress,
        originalMessage: attestation.originalMessage,
        attestation: attestation.attestation
      });

      const hash = await writeContract({
        address: destChain.messageTransmitterAddress as `0x${string}`,
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: 'receiveMessage',
        args: [attestation.originalMessage as `0x${string}`, attestation.attestation as `0x${string}`]
      });

      // 5. Wait for confirmation
      console.log('Waiting for transaction confirmation:', hash);
      addToast({
        title: "Transaction submitted",
        description: "Waiting for confirmation...",
        variant: "default"
      });
      setTxHash(hash);
      
      // Wait for receipt to be available
      let attempts = 0;
      while (attempts < 30) { // Wait up to 30 seconds
        if (receipt) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!receipt) {
        throw new Error('Transaction confirmation timeout');
      }

      // 6. Call completion API
      await circleApi.completeMint({
        attestationId: attestation.id,
        paymentIntentId: attestation.paymentIntentId,
        mintTxHash: hash,
        vendorAddress: vendor.wallet_address,
        destinationChainId: destChain.chainId,
        amount: attestation.amount,
        sourceChain: attestation.sourceChain,
        destinationChain: attestation.destinationChain
      });

      addToast({
        title: "Mint completed successfully!",
        description: `$${(attestation.amount / 1000000).toFixed(2)} USDC minted to your wallet`,
        variant: "success"
      });
      
      console.log('Mint completed successfully!');
    } catch (error) {
      console.error('Minting failed:', error);
      
      addToast({
        title: "Mint failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
      
      // Update status to 'failed' on error
      try {
        await circleApi.updateAttestationStatus({
          attestationId: attestation.id,
          status: 'failed'
        });
      } catch (updateError) {
        console.error('Failed to update status to failed:', updateError);
      }
      
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Error Loading Circle Payments
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {error || "Unable to load vendor data"}
          </p>
          <Button onClick={loadVendor} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
              <CircleDot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Circle CCTP Payments</h1>
              <p className="text-muted-foreground">
                Manage cross-chain USDC minting for {vendor.name}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadVendor} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900 dark:text-green-100">
                Wallet Connection
              </CardTitle>
            </div>
            {isConnected && address && (
              <Badge variant="outline" className="text-green-700 border-green-300">
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-green-800 dark:text-green-200">
          {isConnected && address ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <div>
                  <p className="font-medium">Connected Wallet</p>
                  <p className="text-sm font-mono">{address.substring(0, 20)}...</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => primaryWallet?.disconnect()}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Wallet Required for Minting</p>
                <p className="text-sm">Connect your wallet to mint USDC from attestations</p>
              </div>
              <Button 
                onClick={handleConnectWallet}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900 dark:text-blue-100">
              How Circle CCTP Minting Works
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            <strong>Circle Cross-Chain Transfer Protocol (CCTP)</strong> enables native USDC 
            transfers across blockchains. When customers make cross-chain payments:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>USDC is burned on the source chain</li>
            <li>Circle provides a cryptographic attestation</li>
            <li>You mint the USDC on the destination chain using the attestation</li>
            <li>Funds are immediately available in your wallet</li>
          </ol>
          <div className="flex items-center gap-2 mt-4">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              Vendor Address: {vendor.wallet_address.substring(0, 20)}...
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              Preferred Chain: {vendor.preferred_destination_chain}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Supported Chains */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Networks</CardTitle>
          <CardDescription>
            Circle CCTP is currently available on the following test networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(CIRCLE_CHAINS).map(([key, chain]) => (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{chain.name}</h3>
                  <p className="text-sm text-muted-foreground">Chain ID: {chain.chainId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Testnet</Badge>
                  <a 
                    href={chain.blockExplorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attestations Table */}
      <CircleAttestationsTable 
        vendorAddress={vendor.wallet_address}
        onMint={handleMint}
        isWalletConnected={isConnected}
        onConnectWallet={handleConnectWallet}
      />
    </div>
  );
}