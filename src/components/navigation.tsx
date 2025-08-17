"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useDynamicContext, useIsLoggedIn, useUserWallets } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  CreditCard, 
  Network, 
  Webhook,
  Home,
  LogOut,
  User,
  Wallet
} from "lucide-react";

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Payment Gateway",
    href: "/gateway",
    icon: CreditCard,
  },
  {
    name: "Networks",
    href: "/chains",
    icon: Network,
  },
  {
    name: "Webhooks",
    href: "/webhooks",
    icon: Webhook,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { vendor, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Dynamic.xyz hooks
  const { user: dynamicUser, handleLogOut } = useDynamicContext();
  const isDynamicLoggedIn = useIsLoggedIn();
  const userWallets = useUserWallets();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    // Logout from both systems
    if (isDynamicLoggedIn) {
      handleLogOut();
    }
    logout();
    window.location.href = '/';
  };

  // Determine if user is authenticated (either traditional or wallet-based)
  const isUserAuthenticated = isAuthenticated || isDynamicLoggedIn;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href={isUserAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-xl">PIaaS</span>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {navigation
                .filter((item) => {
                  // Hide "Home" when user is authenticated
                  if (item.href === "/" && isUserAuthenticated) {
                    return false;
                  }
                  return true;
                })
                .map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "flex items-center space-x-2",
                          isActive && "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Button>
                    </Link>
                  );
                })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {mounted && (
              <div className="hidden sm:block">
                <span className="text-sm text-muted-foreground">
                  Backend: {process.env.NEXT_PUBLIC_PROD === 'true' 
                    ? 'crossmeter-api-2.onrender.com' 
                    : 'localhost:8000'}
                </span>
              </div>
            )}
            
            {isUserAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Show vendor info if traditional auth */}
                {isAuthenticated && vendor && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{vendor.name}</span>
                  </div>
                )}
                
                {/* Show wallet info if Dynamic auth */}
                {isDynamicLoggedIn && dynamicUser && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Wallet className="h-3 w-3" />
                    <span className="font-mono">
                      {(dynamicUser as any)?.wallets?.[0]?.address?.slice(0, 6)}...
                      {(dynamicUser as any)?.wallets?.[0]?.address?.slice(-4)}
                    </span>
                  </div>
                )}
                
                <Button size="sm" variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  {isDynamicLoggedIn ? 'Disconnect' : 'Logout'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button size="sm" variant="outline">
                    Connect Wallet
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Join as Vendor
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
