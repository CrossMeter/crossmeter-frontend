"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
import { clientApi } from "@/lib/api";
import type { ClientVendorInfo, ClientProduct, ClientPaymentIntent } from "@/lib/types";
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  ExternalLink,
  Wallet,
  Network
} from "lucide-react";

interface PaymentGatewayProps {
  apiKey: string;
  onPaymentComplete?: (payment: ClientPaymentIntent) => void;
}

export function PaymentGateway({ apiKey, onPaymentComplete }: PaymentGatewayProps) {
  const [vendorInfo, setVendorInfo] = useState<ClientVendorInfo | null>(null);
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ClientProduct | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<ClientPaymentIntent | null>(null);
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'product' | 'payment' | 'submit' | 'complete'>('product');

  const supportedChains = [
    { id: 1, name: "Ethereum Mainnet" },
    { id: 8453, name: "Base Mainnet" },
    { id: 84532, name: "Base Sepolia" },
    { id: 10, name: "Optimism" },
    { id: 42161, name: "Arbitrum One" },
    { id: 137, name: "Polygon" },
  ];

  // Load vendor info and products
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [vendor, productList] = await Promise.all([
          clientApi.getVendorInfo(apiKey),
          clientApi.getProducts(apiKey),
        ]);
        
        setVendorInfo(vendor);
        setProducts(productList);
        
        // Set default chain to vendor's preferred chain
        setSelectedChain(vendor.preferred_dest_chain_id);
      } catch (error: any) {
        setError(error.response?.data?.detail || 'Failed to load vendor information');
      } finally {
        setLoading(false);
      }
    };

    if (apiKey) {
      loadData();
    }
  }, [apiKey]);

  const handleCreatePayment = async () => {
    if (!selectedProduct || !customerEmail || !selectedChain || !vendorInfo) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const payment = await clientApi.createPayment(apiKey, {
        product_id: selectedProduct.product_id,
        customer_email: customerEmail,
        src_chain_id: selectedChain,
        dest_chain_id: vendorInfo.preferred_dest_chain_id,
      });
      
      setPaymentIntent(payment);
      setStep('payment');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentIntent || !txHash) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedPayment = await clientApi.submitPayment(apiKey, paymentIntent.intent_id, txHash);
      setPaymentIntent(updatedPayment);
      setStep('submit');
      
      // Auto-settle for demo purposes (in real app, this would be done by webhook)
      setTimeout(async () => {
        try {
          const settledPayment = await clientApi.settlePayment(apiKey, paymentIntent.intent_id);
          setPaymentIntent(settledPayment);
          setStep('complete');
          onPaymentComplete?.(settledPayment);
        } catch (error) {
          console.error('Auto-settle failed:', error);
        }
      }, 2000);
      
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetGateway = () => {
    setStep('product');
    setSelectedProduct(null);
    setCustomerEmail("");
    setPaymentIntent(null);
    setTxHash("");
    setError(null);
  };

  if (loading && !vendorInfo) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error && !vendorInfo) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center h-40">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          PIaaS Payment Gateway
        </CardTitle>
        <CardDescription>
          {vendorInfo && (
            <span>Pay {vendorInfo.name} with cryptocurrency across multiple blockchains</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Product Selection */}
        {step === 'product' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Product</h3>
            
            <div className="grid gap-3">
              {products.map((product) => (
                <div
                  key={product.product_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProduct?.product_id === product.product_id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{product.description}</p>
                      )}
                      <Badge variant="outline" className="mt-1">
                        {product.product_type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        ${(product.default_amount_usdc_minor / 1000000).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">USDC</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Email</label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Chain</label>
              <Select value={selectedChain?.toString()} onValueChange={(value) => setSelectedChain(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blockchain network" />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains
                    .filter(chain => vendorInfo?.enabled_source_chains.includes(chain.id))
                    .map((chain) => (
                      <SelectItem key={chain.id} value={chain.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4" />
                          {chain.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreatePayment}
              disabled={!selectedProduct || !customerEmail || !selectedChain || loading}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Payment
            </Button>
          </div>
        )}

        {/* Step 2: Payment Instructions */}
        {step === 'payment' && paymentIntent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Complete Payment</h3>
              <Badge>{paymentIntent.status}</Badge>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-3">
              <h4 className="font-medium">Payment Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <div className="font-mono">${(paymentIntent.amount_usdc_minor / 1000000).toFixed(2)} USDC</div>
                </div>
                <div>
                  <span className="text-gray-500">To Wallet:</span>
                  <div className="font-mono flex items-center gap-1">
                    {vendorInfo?.wallet_address.substring(0, 8)}...
                    <button onClick={() => copyToClipboard(vendorInfo?.wallet_address || '')}>
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              {paymentIntent.router && (
                <div className="space-y-2">
                  <span className="text-gray-500">Smart Contract Call:</span>
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono break-all">
                    {paymentIntent.router.calldata}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Hash</label>
              <Input
                placeholder="0x..."
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                After sending the payment from your wallet, paste the transaction hash here
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetGateway} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitPayment}
                disabled={!txHash || loading}
                className="flex-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'submit' && (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
            <h3 className="text-lg font-semibold">Processing Payment...</h3>
            <p className="text-gray-600">Verifying transaction on blockchain</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && paymentIntent && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm">
                Payment ID: <span className="font-mono">{paymentIntent.intent_id}</span>
              </p>
              <p className="text-sm">
                Status: <Badge variant="outline" className="ml-1">{paymentIntent.status}</Badge>
              </p>
            </div>
            <Button onClick={resetGateway} className="w-full">
              Make Another Payment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
