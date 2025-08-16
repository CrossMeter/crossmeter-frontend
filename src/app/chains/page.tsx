"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Network,
  RefreshCw,
  Calculator,
  ExternalLink,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { chainApi } from "@/lib/api";
import type { Chain, EstimateResponse } from "@/lib/types";

export default function ChainsPage() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFromChain, setSelectedFromChain] = useState<string>("");
  const [selectedToChain, setSelectedToChain] = useState<string>("");
  const [amount, setAmount] = useState<string>("10");
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [estimating, setEstimating] = useState(false);

  const loadChains = async () => {
    try {
      setLoading(true);
      const response = await chainApi.getChains();
      setChains(response.data);
    } catch (error) {
      console.error("Failed to load chains:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimate = async () => {
    if (!selectedFromChain || !selectedToChain || !amount) return;
    
    try {
      setEstimating(true);
      const response = await chainApi.estimate({
        amount_cents: parseFloat(amount) * 100,
        src_chain_id: parseInt(selectedFromChain),
        dest_chain_id: parseInt(selectedToChain),
      });
      setEstimate(response.data);
    } catch (error) {
      console.error("Failed to calculate estimate:", error);
      setEstimate(null);
    } finally {
      setEstimating(false);
    }
  };

  const validateChains = async (fromChain: string, toChain: string) => {
    if (!fromChain || !toChain) return null;
    
    try {
      await chainApi.validate(parseInt(fromChain), parseInt(toChain));
      return true;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    loadChains();
  }, []);

  useEffect(() => {
    if (selectedFromChain && selectedToChain && amount) {
      calculateEstimate();
    }
  }, [selectedFromChain, selectedToChain, amount]);

  const getChainTypeIcon = (chainId: number) => {
    // Mainnet chains
    const mainnets = [1, 8453, 10, 42161, 137];
    return mainnets.includes(chainId) ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <div className="h-4 w-4 bg-yellow-500 rounded-full" />
    );
  };

  const formatGasLimit = (gasLimit: number) => {
    return gasLimit.toLocaleString();
  };

  const formatBridgeFee = (basisPoints: number) => {
    return `${(basisPoints / 100).toFixed(2)}%`;
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supported Blockchain Networks</h1>
          <p className="text-muted-foreground">
            Overview of all supported chains and their configurations
          </p>
        </div>
        <Button onClick={loadChains} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Cost Calculator */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Payment Cost Calculator
          </CardTitle>
          <CardDescription>
            Calculate bridge fees and gas estimates for cross-chain payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label>From Chain</Label>
              <Select value={selectedFromChain} onValueChange={setSelectedFromChain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source chain" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      <div className="flex items-center gap-2">
                        {getChainTypeIcon(chain.id)}
                        {chain.name} ({chain.id})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>To Chain</Label>
              <Select value={selectedToChain} onValueChange={setSelectedToChain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination chain" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      <div className="flex items-center gap-2">
                        {getChainTypeIcon(chain.id)}
                        {chain.name} ({chain.id})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={calculateEstimate} 
                disabled={estimating || !selectedFromChain || !selectedToChain || !amount}
                className="w-full"
              >
                {estimating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  "Calculate"
                )}
              </Button>
            </div>
          </div>
          
          {estimate && (
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <h3 className="font-medium mb-3">Cost Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Base Amount:</span>
                  <span>${(estimate.base_amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bridge Fee:</span>
                  <span>${(estimate.bridge_fee / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total Amount:</span>
                  <span>${(estimate.total_amount / 100).toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Estimated gas: {estimate.gas_estimate.toLocaleString()} units
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chains Table */}
      <Card>
        <CardHeader>
          <CardTitle>Network Details</CardTitle>
          <CardDescription>
            Detailed information about each supported blockchain network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network</TableHead>
                <TableHead>Chain ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bridge Fee</TableHead>
                <TableHead>Gas Limit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chains.map((chain) => (
                <TableRow key={chain.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{chain.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {chain.id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getChainTypeIcon(chain.id)}
                      <span className="text-sm">
                        {[1, 8453, 10, 42161, 137].includes(chain.id) ? "Mainnet" : "Testnet"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {chain.enabled ? (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatBridgeFee(chain.bridge_fee_basis_points)}
                  </TableCell>
                  <TableCell>
                    {formatGasLimit(chain.gas_limit)}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{chain.name} Details</DialogTitle>
                          <DialogDescription>
                            Network configuration and contract addresses
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Chain ID</h4>
                              <p className="text-sm text-muted-foreground font-mono">{chain.id}</p>
                            </div>
                            <div>
                              <h4 className="font-medium">Status</h4>
                              <div className="flex items-center gap-2">
                                {chain.enabled ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">Enabled</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-sm">Disabled</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Router Contract</h4>
                            <p className="text-xs text-muted-foreground font-mono break-all">
                              {chain.router_address}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">USDC Contract</h4>
                            <p className="text-xs text-muted-foreground font-mono break-all">
                              {chain.usdc_address}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Bridge Fee</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatBridgeFee(chain.bridge_fee_basis_points)}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Gas Limit</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatGasLimit(chain.gas_limit)} units
                              </p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Network Information
              </h3>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• <strong>Mainnet chains</strong> are production-ready networks with real value</li>
                <li>• <strong>Testnet chains</strong> are for development and testing purposes</li>
                <li>• <strong>Bridge fees</strong> are charged when transferring between different chains</li>
                <li>• <strong>Gas limits</strong> are estimated maximums for transaction execution</li>
                <li>• Same-chain transfers use <code>createPayment</code>, cross-chain use <code>bridgePayment</code></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
