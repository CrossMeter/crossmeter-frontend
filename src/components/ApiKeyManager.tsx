"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { vendorApi } from "@/lib/api";
import { Copy, RefreshCw, Eye, EyeOff, Key } from "lucide-react";

export function ApiKeyManager() {
  const { vendor, refreshVendor } = useAuth();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!vendor?.api_key) return;
    
    try {
      await navigator.clipboard.writeText(vendor.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy API key:', error);
    }
  };

  const handleRegenerate = async () => {
    if (!vendor) return;
    
    if (!confirm('Are you sure you want to regenerate your API key? This will invalidate the current key and may break existing integrations.')) {
      return;
    }

    setIsRegenerating(true);
    try {
      await vendorApi.regenerateApiKey(vendor.vendor_id || vendor.id!);
      await refreshVendor(); // Refresh vendor data to get new API key
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const maskedApiKey = vendor?.api_key 
    ? `${vendor.api_key.substring(0, 12)}${'*'.repeat(vendor.api_key.length - 16)}${vendor.api_key.substring(vendor.api_key.length - 4)}`
    : '';

  if (!vendor) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key Management
        </CardTitle>
        <CardDescription>
          Use this API key to integrate PIaaS payment gateway into your applications.
          Keep it secure and don&apos;t expose it in client-side code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Your API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showApiKey ? "text" : "password"}
                value={showApiKey ? vendor.api_key || '' : maskedApiKey}
                readOnly
                className="pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!vendor.api_key}
            >
              <Copy className="h-4 w-4 mr-1" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-200">Security Warning</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This API key provides access to all your vendor data. Never share it publicly or include it in client-side code.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate API Key'}
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Usage Examples</h4>
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm font-mono space-y-2">
            <div>
              <Badge variant="secondary" className="mb-1">JavaScript</Badge>
              <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
{`// Get vendor info
fetch('/v1/client/vendor', {
  headers: { 'X-API-Key': '${maskedApiKey}' }
})

// Create payment
fetch('/v1/client/payment', {
  method: 'POST',
  headers: {
    'X-API-Key': '${maskedApiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product_id: 'p_123',
    customer_email: 'user@example.com',
    src_chain_id: 8453,
    dest_chain_id: 8453
  })
})`}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
