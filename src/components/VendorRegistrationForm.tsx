"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Wallet, Loader2 } from "lucide-react";
import { vendorStatusApi } from "@/lib/api";

const formSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email("Invalid email address"),
  webhook_url: z.string().url("Invalid webhook URL").optional().or(z.literal("")),
  preferred_destination_chain: z.number(),
  enabled_source_chains: z.array(z.number()).min(1, "Select at least one source chain"),
  description: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

const supportedChains = [
  { id: 1, name: "Ethereum Mainnet" },
  { id: 8453, name: "Base Mainnet" },
  { id: 84532, name: "Base Sepolia" },
  { id: 10, name: "Optimism" },
  { id: 42161, name: "Arbitrum One" },
  { id: 137, name: "Polygon" },
];

interface VendorRegistrationFormProps {
  walletAddress: string;
  onSuccess: (vendor: any) => void;
  onCancel: () => void;
}

export function VendorRegistrationForm({ walletAddress, onSuccess, onCancel }: VendorRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      webhook_url: "",
      preferred_destination_chain: 8453, // Default to Base Mainnet
      enabled_source_chains: [8453], // Default to Base Mainnet
      description: "",
      website: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const vendorData = {
        ...data,
        wallet_address: walletAddress,
      };

      const response = await vendorStatusApi.createWithWallet(vendorData);
      onSuccess(response);
    } catch (error: any) {
      console.error("Failed to create vendor:", error);
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Complete Your Vendor Profile
        </CardTitle>
        <CardDescription>
          Please provide the required information to complete your vendor account setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Wallet Address (Read-only) */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Wallet className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Connected Wallet</h3>
              </div>
              <div className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                {walletAddress}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                This wallet address will be used for receiving payments and authentication.
              </p>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Information
              </h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your business name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="vendor@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Used for important notifications and account recovery
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of your business..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of your business or services
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-website.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Configuration
              </h3>

              <FormField
                control={form.control}
                name="preferred_destination_chain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Destination Chain *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination chain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supportedChains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id.toString()}>
                            {chain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The blockchain network where you want to receive payments by default
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled_source_chains"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Enabled Source Chains *</FormLabel>
                      <FormDescription>
                        Select which blockchain networks your customers can pay from
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {supportedChains.map((chain) => (
                        <FormField
                          key={chain.id}
                          control={form.control}
                          name="enabled_source_chains"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={chain.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(chain.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, chain.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== chain.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {chain.name}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Integration Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Integration Settings
              </h3>

              <FormField
                control={form.control}
                name="webhook_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-api.com/webhooks" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional webhook endpoint to receive payment notifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Vendor Account"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
