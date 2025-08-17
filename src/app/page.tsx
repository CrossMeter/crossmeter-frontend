'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CreditCard, BarChart3, Webhook, Zap, Wallet } from "lucide-react";
import { useIsLoggedIn, useDynamicContext, useUserWallets } from '@dynamic-labs/sdk-react-core';

export default function Home() {
  const isLoggedIn = useIsLoggedIn();
  const { setShowAuthFlow, user } = useDynamicContext();
  const userWallets = useUserWallets();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            PIaaS Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Payment Infrastructure as a Service - The complete crypto payment processing platform.
            Accept payments across 6 major blockchain networks with ease.
          </p>
          
          {/* Dynamic Authentication Section */}
          {isLoggedIn ? (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">Wallet Connected</span>
              </div>
              {user && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Welcome, {user.email || 'User'}!
                </p>
              )}
              {userWallets.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {userWallets[0].address.slice(0, 6)}...{userWallets[0].address.slice(-4)}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Link href="/dashboard">
                  <Button size="sm" className="text-sm">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={() => setShowAuthFlow(true)}
              >
                Connect Wallet & Create Vendor Account
                <Wallet className="ml-2 h-5 w-5" />
              </Button>
              <Link href="/gateway">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  Try Payment Gateway
                  <CreditCard className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
          
          {/* Traditional auth links */}
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Start as Vendor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Already a vendor? <Link href="/login" className="text-blue-600 hover:underline">Sign in here</Link>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-fit mb-4">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Multi-Chain Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Accept crypto payments across 6 major blockchain networks including Ethereum, Base, Arbitrum, and more.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Real-time Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track payment intents, subscription management, and transaction status in real-time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-purple-100 dark:bg-purple-900 p-3 rounded-full w-fit mb-4">
                <Webhook className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Webhook Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated webhook notifications with retry logic for seamless integration with your systems.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-orange-100 dark:bg-orange-900 p-3 rounded-full w-fit mb-4">
                <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Smart Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated smart contract integration with real ABI encoding and cross-chain bridge support.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Web3 Authentication Benefits */}
        {!isLoggedIn && (
          <div className="mb-16">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                  Why Connect Your Wallet?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <Wallet className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Seamless Authentication</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      No passwords needed. Connect with MetaMask, WalletConnect, or any supported wallet.
                    </p>
                  </div>
                  <div>
                    <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Direct Payments</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Receive payments directly to your wallet across multiple blockchain networks.
                    </p>
                  </div>
                  <div>
                    <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Complete Control</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Full control over your funds with real-time analytics and transaction tracking.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Supported Chains */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Supported Blockchain Networks
          </h2>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { name: "Ethereum", id: 1 },
              { name: "Base", id: 8453 },
              { name: "Optimism", id: 10 },
              { name: "Arbitrum", id: 42161 },
              { name: "Polygon", id: 137 },
              { name: "Base Sepolia", id: 84532 },
            ].map((chain) => (
              <div
                key={chain.id}
                className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow border"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {chain.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  ({chain.id})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}