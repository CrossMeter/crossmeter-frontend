"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import type { Vendor, LoginRequest, CreateVendorRequest, AuthResponse } from '@/lib/types';

interface AuthContextType {
  vendor: Vendor | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: CreateVendorRequest) => Promise<void>;
  logout: () => void;
  refreshVendor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = authApi.isAuthenticated() && !!vendor;

  // Load current vendor on mount
  useEffect(() => {
    const loadCurrentVendor = async () => {
      if (authApi.isAuthenticated()) {
        try {
          const currentVendor = await authApi.me();
          setVendor(currentVendor);
        } catch (error) {
          console.error('Failed to load current vendor:', error);
          authApi.logout(); // Clear invalid token
        }
      }
      setIsLoading(false);
    };

    loadCurrentVendor();
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const authResponse = await authApi.login(data);
      const currentVendor = await authApi.me();
      setVendor(currentVendor);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: CreateVendorRequest) => {
    setIsLoading(true);
    try {
      console.log('AuthContext: Starting registration...');
      const authResponse = await authApi.register(data);
      console.log('AuthContext: Registration API successful, fetching vendor...');
      const currentVendor = await authApi.me();
      console.log('AuthContext: Vendor fetched successfully:', currentVendor.name);
      setVendor(currentVendor);
    } catch (error) {
      console.error('AuthContext: Registration failed:', error);
      setIsLoading(false); // Reset loading state on error
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setVendor(null);
  };

  const refreshVendor = async () => {
    if (authApi.isAuthenticated()) {
      try {
        const currentVendor = await authApi.me();
        setVendor(currentVendor);
      } catch (error) {
        console.error('Failed to refresh vendor:', error);
        logout();
      }
    }
  };

  const value = {
    vendor,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshVendor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
