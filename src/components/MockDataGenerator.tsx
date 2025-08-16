"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { paymentIntentApi, subscriptionApi } from "@/lib/api";
import { Loader2, Database } from "lucide-react";

export function MockDataGenerator() {
  const { vendor } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const generateMockData = async () => {
    if (!vendor) return;
    
    setIsGenerating(true);
    setResults([]);
    const newResults: string[] = [];

    try {
      // Get vendor's products first
      const API_BASE_URL = process.env.NEXT_PUBLIC_PROD === 'true' 
        ? 'https://crossmeter-api-2.onrender.com' 
        : 'http://localhost:8000';
        
      const productsResponse = await fetch(`${API_BASE_URL}/v1/vendors/${vendor.vendor_id || vendor.id}/products/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const products = await productsResponse.json();
      
      if (products.length === 0) {
        newResults.push("❌ No products found. Create some products first!");
        setResults([...newResults]);
        setIsGenerating(false);
        return;
      }

      const product = products[0]; // Use first product
      newResults.push(`✅ Using product: ${product.name}`);
      setResults([...newResults]);

      // Generate 5 payment intents with different statuses
      const paymentStatuses = ['created', 'awaiting_user_tx', 'submitted', 'settled', 'settled'];
      const customerEmails = ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com', 'eve@test.com'];
      
      for (let i = 0; i < 5; i++) {
        try {
          const paymentData = {
            vendor_id: vendor.vendor_id || vendor.id,
            product_id: product.product_id,
            src_chain_id: 8453, // Base
            dest_chain_id: 8453, // Base
            amount_usdc_minor: Math.floor(Math.random() * 500000) + 100000, // Random amount between $10-$60
            customer_email: customerEmails[i],
          };

          const response = await fetch(`${API_BASE_URL}/v1/payment_intents/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
          });

          if (response.ok) {
            const payment = await response.json();
            newResults.push(`✅ Created payment intent: ${payment.intent_id} (${paymentStatuses[i]})`);
            
            // Update payment status if needed
            if (paymentStatuses[i] !== 'created') {
              if (paymentStatuses[i] === 'submitted' || paymentStatuses[i] === 'settled') {
                await fetch(`${API_BASE_URL}/v1/payment_intents/${payment.intent_id}/tx/source`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ tx_hash: `0x${Math.random().toString(16).substr(2, 40)}` }),
                });
                newResults.push(`  ↳ Updated to submitted status`);
              }
              
              if (paymentStatuses[i] === 'settled') {
                await fetch(`${API_BASE_URL}/v1/payment_intents/${payment.intent_id}/tx/destination`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ tx_hash: `0x${Math.random().toString(16).substr(2, 40)}` }),
                });
                newResults.push(`  ↳ Updated to settled status`);
              }
            }
          } else {
            newResults.push(`❌ Failed to create payment ${i + 1}: ${response.statusText}`);
          }
          setResults([...newResults]);
        } catch (error) {
          newResults.push(`❌ Error creating payment ${i + 1}: ${error}`);
          setResults([...newResults]);
        }
      }

      // Generate 2 subscriptions
      for (let i = 0; i < 2; i++) {
        try {
          const subscriptionData = {
            vendor_id: vendor.vendor_id || vendor.id,
            customer_email: customerEmails[i], // Backend expects customer_email not customer object
            product_id: product.product_id,
            plan_id: product.product_id, // Backend expects plan_id (same as product_id)
            billing_interval: 'monthly', // Backend expects enum: 'monthly', 'quarterly', 'yearly'
            amount_usdc_minor: product.default_amount_usdc_minor, // Backend expects amount
            src_chain_id: 8453,
            dest_chain_id: 8453,
          };

          const response = await fetch(`${API_BASE_URL}/v1/subscriptions/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscriptionData),
          });

          if (response.ok) {
            const subscription = await response.json();
            newResults.push(`✅ Created subscription: ${subscription.subscription_id}`);
          } else {
            const errorText = await response.text();
            newResults.push(`❌ Failed to create subscription ${i + 1}: ${response.status} ${response.statusText}`);
            newResults.push(`  ↳ Error details: ${errorText}`);
          }
          setResults([...newResults]);
        } catch (error) {
          newResults.push(`❌ Error creating subscription ${i + 1}: ${error}`);
          setResults([...newResults]);
        }
      }

      newResults.push(`🎉 Mock data generation complete!`);
      newResults.push(`📊 Refresh your dashboard to see the data`);
      
    } catch (error) {
      newResults.push(`❌ Error: ${error}`);
    } finally {
      setResults(newResults);
      setIsGenerating(false);
    }
  };

  if (!vendor) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Mock Data Generator
        </CardTitle>
        <CardDescription>
          Generate test payments and subscriptions to see dashboard features in action
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generateMockData}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Mock Data...
            </>
          ) : (
            'Generate Test Data'
          )}
        </Button>

        {results.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-80 overflow-y-auto">
            <h4 className="font-medium mb-2">Generation Log:</h4>
            <div className="space-y-1 text-sm font-mono">
              {results.map((result, index) => (
                <div key={index} className={
                  result.startsWith('✅') ? 'text-green-600' :
                  result.startsWith('❌') ? 'text-red-600' :
                  result.startsWith('🎉') ? 'text-blue-600 font-bold' :
                  result.startsWith('📊') ? 'text-purple-600 font-bold' :
                  'text-gray-600'
                }>
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
