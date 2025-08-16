"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaymentGateway } from "@/components/PaymentGateway";
import type { ClientPaymentIntent } from "@/lib/types";
import { Key, CreditCard } from "lucide-react";

export default function GatewayTestPage() {
  const [apiKey, setApiKey] = useState("");
  const [showGateway, setShowGateway] = useState(false);
  const [completedPayments, setCompletedPayments] = useState<ClientPaymentIntent[]>([]);

  const handlePaymentComplete = (payment: ClientPaymentIntent) => {
    setCompletedPayments(prev => [...prev, payment]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            PIaaS Payment Gateway Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Test the payment gateway by entering a vendor's API key. This demonstrates how clients can integrate 
            PIaaS payment processing into their applications.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {!showGateway ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Enter API Key
                </CardTitle>
                <CardDescription>
                  Enter a vendor's API key to load their payment gateway. You can find your API key 
                  in the vendor dashboard under the "API Key" tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vendor API Key</label>
                  <Input
                    type="password"
                    placeholder="piaas_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <Button
                  onClick={() => setShowGateway(true)}
                  disabled={!apiKey}
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Load Payment Gateway
                </Button>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How to get an API key:</h4>
                  <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>Sign up as a vendor or log into your vendor account</li>
                    <li>Go to your vendor dashboard</li>
                    <li>Click on the "API Key" tab</li>
                    <li>Copy your API key and paste it here</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Payment Gateway</h2>
                <Button variant="outline" onClick={() => setShowGateway(false)}>
                  Change API Key
                </Button>
              </div>

              <PaymentGateway
                apiKey={apiKey}
                onPaymentComplete={handlePaymentComplete}
              />

              {completedPayments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Payments</CardTitle>
                    <CardDescription>
                      Payments processed during this session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {completedPayments.map((payment) => (
                        <div
                          key={payment.intent_id}
                          className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                        >
                          <div>
                            <div className="font-mono text-sm">{payment.intent_id}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {payment.customer_email}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              ${(payment.amount_usdc_minor / 1000000).toFixed(2)}
                            </div>
                            <div className="text-sm text-green-600">{payment.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
