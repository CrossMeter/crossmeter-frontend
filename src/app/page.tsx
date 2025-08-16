import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CreditCard, BarChart3, Webhook, Zap } from "lucide-react";

export default function Home() {
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
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start as Vendor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/gateway">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Try Payment Gateway
                <CreditCard className="ml-2 h-5 w-5" />
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
