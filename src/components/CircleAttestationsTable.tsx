"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ExternalLink,
  RefreshCw,
  Coins,
  ArrowRight,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from "lucide-react";
import { circleApi } from "@/lib/api";
import type { AttestationData, AttestationsResponse } from "@/lib/types";
import { CIRCLE_CHAINS, getChainConfig } from "@/lib/circle-config";
import { formatDistance } from "date-fns";

interface CircleAttestationsTableProps {
  vendorAddress: string;
  onMint?: (attestation: AttestationData) => Promise<void>;
  isWalletConnected?: boolean;
  onConnectWallet?: () => void;
}

export function CircleAttestationsTable({ 
  vendorAddress, 
  onMint, 
  isWalletConnected = false, 
  onConnectWallet 
}: CircleAttestationsTableProps) {
  const [attestations, setAttestations] = useState<AttestationData[]>([]);
  const [summary, setSummary] = useState<{
    pending_mint: number; 
    minting: number; 
    minted: number; 
    failed: number; 
  }>({ pending_mint: 0, minting: 0, minted: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [mintingIds, setMintingIds] = useState<Set<string>>(new Set());

  const loadAttestations = async () => {
    try {
      setLoading(true);
      const response = await circleApi.getPendingAttestations(vendorAddress);
      setAttestations(response.attestations);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load attestations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorAddress) {
      loadAttestations();
      // Set up polling every 30 seconds
      const interval = setInterval(loadAttestations, 30000);
      return () => clearInterval(interval);
    }
  }, [vendorAddress]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending_mint': { 
        variant: 'secondary' as const, 
        icon: Clock, 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
      },
      'minting': { 
        variant: 'default' as const, 
        icon: RefreshCw, 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
      },
      'minted': { 
        variant: 'default' as const, 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
      },
      'failed': { 
        variant: 'destructive' as const, 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="outline">{status}</Badge>;

    const IconComponent = config.icon;

    return (
      <Badge className={config.className}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const getChainRoute = (sourceChain: string, destinationChain: string) => {
    const sourceConfig = getChainConfig(sourceChain);
    const destConfig = getChainConfig(destinationChain);
    
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{sourceConfig?.name || sourceChain}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">{destConfig?.name || destinationChain}</span>
      </div>
    );
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleMint = async (attestation: AttestationData) => {
    if (!onMint) return;
    
    setMintingIds(prev => new Set(prev).add(attestation.id));
    try {
      await onMint(attestation);
      await loadAttestations(); // Refresh data after minting
    } catch (error) {
      console.error("Minting failed:", error);
    } finally {
      setMintingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attestation.id);
        return newSet;
      });
    }
  };

  const getTxHashLink = (txHash: string, chainName: string) => {
    const chainConfig = getChainConfig(chainName);
    if (!chainConfig) return txHash;
    
    return (
      <a 
        href={`${chainConfig.blockExplorer}/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center gap-1"
      >
        {txHash.substring(0, 10)}...
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{summary.pending_mint}</p>
                <p className="text-xs text-muted-foreground">Pending Mint</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{summary.minting}</p>
                <p className="text-xs text-muted-foreground">Minting</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{summary.minted}</p>
                <p className="text-xs text-muted-foreground">Minted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{summary.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attestations Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Circle CCTP Attestations</CardTitle>
            <CardDescription>
              Manage pending USDC mints from cross-chain transfers
            </CardDescription>
          </div>
          <Button onClick={loadAttestations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Burn Tx</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attestations.map((attestation) => (
                <TableRow key={attestation.id}>
                  <TableCell className="font-mono text-xs">
                    {attestation.paymentIntentId.substring(0, 12)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        ${(attestation.amount / 1000000).toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">
                        {attestation.customerAddress.substring(0, 8)}...
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyAddress(attestation.customerAddress)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getChainRoute(attestation.sourceChain, attestation.destinationChain)}
                  </TableCell>
                  <TableCell>
                    {getTxHashLink(attestation.burnTxHash, attestation.sourceChain)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDistance(new Date(attestation.burnTimestamp), new Date(), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(attestation.status)}
                  </TableCell>
                  <TableCell>
                    {attestation.status === 'pending_mint' && onMint && (
                      isWalletConnected ? (
                        <Button
                          size="sm"
                          onClick={() => handleMint(attestation)}
                          disabled={mintingIds.has(attestation.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {mintingIds.has(attestation.id) ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Minting...
                            </>
                          ) : (
                            <>
                              <Coins className="h-3 w-3 mr-1" />
                              Mint
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onConnectWallet}
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          Connect Wallet
                        </Button>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {attestations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    <div className="space-y-2">
                      <Coins className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p>No Circle attestations found</p>
                      <p className="text-sm">Attestations will appear here when customers make cross-chain payments</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}