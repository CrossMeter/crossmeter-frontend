"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Building2,
  Package,
  CreditCard, 
  DollarSign, 
  Repeat, 
  Activity,
  Plus,
  Settings,
  ExternalLink,
  RefreshCw,
  Wallet,
  Globe
} from "lucide-react";
import { vendorApi, productApi, paymentIntentApi, subscriptionApi } from "@/lib/api";
import type { Vendor, Product, PaymentIntent, Subscription } from "@/lib/types";
import { formatDistance } from "date-fns";
import { MockDataGenerator } from "@/components/MockDataGenerator";
import { ApiKeyManager } from "@/components/ApiKeyManager";

export default function VendorDashboardPage() {
  const params = useParams();
  const vendorId = params.vendorId as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentIntents, setPaymentIntents] = useState<PaymentIntent[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vendorRes, productsRes, paymentsRes, subscriptionsRes] = await Promise.all([
        vendorApi.get(vendorId),
        productApi.getAll(vendorId),
        paymentIntentApi.getAll(vendorId),
        subscriptionApi.getAll(vendorId),
      ]);
      
      setVendor(vendorRes.data);
      setProducts(productsRes.data);
      setPaymentIntents(paymentsRes.data);
      setSubscriptions(subscriptionsRes.data);
    } catch (error) {
      console.error("Failed to load vendor data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vendorId]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      created: "outline",
      settled: "default",
      failed: "destructive",
      active: "default",
      paused: "secondary",
      cancelled: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  const getPricingModelBadge = (model: string) => {
    const colors: Record<string, string> = {
      one_off: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      monthly: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      pay_per_use: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[model] || ""}`}>
        {model.replace(/_/g, " ").toUpperCase()}
      </span>
    );
  };

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.is_active).length,
    totalPayments: paymentIntents.length,
    totalRevenue: paymentIntents
      .filter(p => p.status === "settled")
      .reduce((sum, p) => sum + (p.amount_cents || 0), 0) / 100,
    activeSubscriptions: subscriptions.filter(s => s.status === "active").length,
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

  if (!vendor) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Vendor not found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            The vendor with ID {vendorId} could not be found.
          </p>
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
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{vendor.name}</h1>
              <p className="text-muted-foreground">{vendor.email}</p>
            </div>
          </div>
          {vendor.description && (
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
              {vendor.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/vendor/${vendorId}/products`}>
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Package className="h-4 w-4 mr-2" />
              Product Management
            </Button>
          </Link>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href={`/vendor/${vendorId}/settings`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Vendor Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Wallet Address</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {vendor.wallet_address.substring(0, 20)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Preferred Chain</p>
                <p className="text-xs text-muted-foreground">
                  Chain ID: {vendor.preferred_destination_chain}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Source Chains</p>
                <p className="text-xs text-muted-foreground">
                  {vendor.enabled_source_chains.length} enabled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProducts} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              Total payment intents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Settled payments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Active recurring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
          <TabsTrigger value="api-key">API Key</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>
                  Manage your product catalog and pricing
                </CardDescription>
              </div>
              <Link href={`/vendor/${vendorId}/products`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Pricing Model</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground">
                              {product.description.substring(0, 50)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPricingModelBadge(product.pricing_model || 'one_off')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>${((product.price_cents || 0) / 100).toFixed(2)}</p>
                          {product.pricing_model === 'monthly' && (
                            <p className="text-xs text-muted-foreground">
                              every {product.billing_interval_days} days
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistance(new Date(product.created_at), new Date(), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Link href={`/vendor/${vendorId}/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        <div className="space-y-2">
                          <Package className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p>No products yet</p>
                          <Link href={`/vendor/${vendorId}/products`}>
                            <Button variant="outline" size="sm">
                              Add your first product
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payment Intents</CardTitle>
              <CardDescription>
                Latest payment transactions for your products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction Hash</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentIntents.slice(0, 10).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">
                        {payment.id?.substring(0, 12)}...
                      </TableCell>
                      <TableCell>
                        ${((payment.amount_cents || 0) / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.status === 'created' ? '-' : 
                          payment.transaction_hash ? 
                            payment.transaction_hash : 
                            'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {formatDistance(new Date(payment.created_at), new Date(), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {paymentIntents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No payments yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>
                Manage recurring payment subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscription ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-mono text-xs">
                        {subscription.id?.substring(0, 12)}...
                      </TableCell>
                      <TableCell>{subscription.customer_id}</TableCell>
                      <TableCell>
                        {getStatusBadge(subscription.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(subscription.next_billing_date || '').toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {formatDistance(new Date(subscription.created_at), new Date(), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {subscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No subscriptions yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-key" className="space-y-4">
          <ApiKeyManager />
        </TabsContent>

        <TabsContent value="mock-data" className="space-y-4">
          <div className="flex justify-center">
            <MockDataGenerator />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
