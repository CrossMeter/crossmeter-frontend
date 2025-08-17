"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useIsLoggedIn, useDynamicContext, useUserWallets } from '@dynamic-labs/sdk-react-core';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowRight, CreditCard, BarChart3, Copy, ExternalLink, Loader2 } from "lucide-react";
import { vendorStatusApi } from "@/lib/api";
import { VendorRegistrationForm } from "@/components/VendorRegistrationForm";
import { useWalletUserCreation } from "@/hooks/useWalletUserCreation";

export default function DashboardPage() {
  const router = useRouter();
  const { vendor, isLoading: authLoading, isAuthenticated } = useAuth();
  
  // Dynamic.xyz hooks
  const isDynamicLoggedIn = useIsLoggedIn();
  const { user: dynamicUser, handleLogOut, setShowAuthFlow } = useDynamicContext();
  const userWallets = useUserWallets();
  const primaryWallet = userWallets[0];

  const [signedMessage, setSignedMessage] = useState<string>('');
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  
  // Vendor status state
  const [vendorStatus, setVendorStatus] = useState<{
    loading: boolean;
    exists: boolean;
    vendor?: any;
    isComplete: boolean;
  }>({
    loading: false,
    exists: false,
    isComplete: false
  });
  
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // Handle user creation when wallet connects
  useWalletUserCreation();

  // Check vendor status when wallet is connected
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (isDynamicLoggedIn && primaryWallet?.address && !vendorStatus.loading) {
        setVendorStatus(prev => ({ ...prev, loading: true }));
        
        try {
          const status = await vendorStatusApi.checkByWallet(primaryWallet.address);
          setVendorStatus({
            loading: false,
            exists: status.exists,
            vendor: status.vendor,
            isComplete: status.isComplete
          });
          
          // If user exists but no vendor profile, show registration form
          if (status.exists && !status.isComplete) {
            setShowRegistrationForm(true);
          }
        } catch (error) {
          console.error('Error checking vendor status:', error);
          setVendorStatus({
            loading: false,
            exists: false,
            isComplete: false
          });
        }
      }
    };

    checkVendorStatus();
  }, [isDynamicLoggedIn, primaryWallet?.address, vendorStatus.loading]);

  // Handle authentication redirects
  useEffect(() => {
    if (!authLoading) {
      if (!isDynamicLoggedIn) {
        router.push('/login');
      }
    }
  }, [authLoading, isDynamicLoggedIn, router]);

  // Handle message signing
  const handleSignMessage = async () => {
    if (!primaryWallet) return;

    setIsSigningMessage(true);
    try {
      const message = `Hello from PIaaS Dashboard!\nTimestamp: ${new Date().toISOString()}\nWallet: ${primaryWallet.address}`;
      
      // Check if signMessage is available on the connector
      const connector = primaryWallet.connector as any;
      if (typeof connector.signMessage === 'function') {
        const signature = await connector.signMessage(message);
        setSignedMessage(`Message: ${message}\n\nSignature: ${signature}`);
      } else {
        setSignedMessage(`Message signing not supported by ${primaryWallet.connector.name}`);
      }
    } catch (error) {
      console.error('Error signing message:', error);
      setSignedMessage('Error signing message. Please try again.');
    } finally {
      setIsSigningMessage(false);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Handle vendor registration success
  const handleVendorRegistrationSuccess = (vendorData: any) => {
    setVendorStatus({
      loading: false,
      exists: true,
      vendor: vendorData,
      isComplete: true
    });
    setShowRegistrationForm(false);
    
    // Redirect to vendor dashboard
    const vendorId = vendorData.vendor_id;
    router.push(`/vendor/${vendorId}`);
  };

  // Show loading state
  if (authLoading || vendorStatus.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {authLoading ? "Loading your dashboard..." : "Checking vendor status..."}
          </p>
        </div>
      </div>
    );
  }

  // Show vendor registration form if wallet connected but no vendor account
  if (showRegistrationForm && primaryWallet?.address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <VendorRegistrationForm
            walletAddress={primaryWallet.address}
            onSuccess={handleVendorRegistrationSuccess}
            onCancel={() => setShowRegistrationForm(false)}
          />
        </div>
      </div>
    );
  }

  // If user has wallet connected, show wallet dashboard
  if (isDynamicLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Wallet Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Connected</span>
                </div>
                <Button
                  onClick={handleLogOut}
                  variant="outline"
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dynamicUser && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                    <p className="font-mono text-sm">{dynamicUser.userId}</p>
                  </div>
                )}
                {dynamicUser?.email && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-sm">{dynamicUser.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connected Wallets</p>
                  <p className="text-sm">{userWallets.length} wallet(s) connected</p>
                </div>
              </CardContent>
            </Card>

            {/* Primary Wallet */}
            {primaryWallet && (
              <Card>
                <CardHeader>
                  <CardTitle>Primary Wallet</CardTitle>
                  <CardDescription>Your main connected wallet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Wallet Type</p>
                    <p className="font-medium">{primaryWallet.connector.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm break-all">{primaryWallet.address}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(primaryWallet.address)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Network</p>
                    <p className="text-sm">{primaryWallet.chain || 'Unknown'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with PIaaS services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!vendorStatus.exists ? (
                  <Button 
                    className="w-full justify-start" 
                    onClick={() => setShowRegistrationForm(true)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Create Vendor Account
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Button>
                ) : !vendorStatus.isComplete ? (
                  <Button 
                    className="w-full justify-start" 
                    onClick={() => setShowRegistrationForm(true)}
                  >
                    <Loader2 className="mr-2 h-4 w-4" />
                    Complete Vendor Profile
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      const vendorId = vendorStatus.vendor?.vendor_id;
                      if (vendorId) router.push(`/vendor/${vendorId}`);
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Go to Vendor Dashboard
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Button>
                )}
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/gateway')}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Try Payment Gateway
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Message Signing */}
            <Card>
              <CardHeader>
                <CardTitle>Message Signing</CardTitle>
                <CardDescription>Test wallet signature functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleSignMessage}
                  disabled={!primaryWallet || isSigningMessage}
                  className="w-full"
                >
                  {isSigningMessage ? 'Signing...' : 'Sign Test Message'}
                </Button>
                
                {signedMessage && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">Signed Message:</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(signedMessage)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                      {signedMessage}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Vendor Status Information */}
          {vendorStatus.exists && (
            <Card className="mt-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100">
                  Vendor Account Found
                </CardTitle>
                <CardDescription>
                  {vendorStatus.isComplete 
                    ? "Your vendor account is complete and ready to use."
                    : "Your vendor account needs additional information to be fully activated."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Name:</strong> {vendorStatus.vendor?.name || 'Not set'}
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong> {vendorStatus.vendor?.email || 'Not set'}
                  </p>
                  <p className="text-sm">
                    <strong>Status:</strong> {vendorStatus.isComplete ? 'Complete' : 'Incomplete'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // If no authentication at all, redirect will happen in useEffect
  return null;
}