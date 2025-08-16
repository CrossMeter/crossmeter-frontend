"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, CreditCard } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import type { CreateVendorRequest } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  webhook_url: z.string().url("Invalid webhook URL").optional().or(z.literal("")),
  wallet_address: z.string().min(42, "Invalid wallet address").max(42, "Invalid wallet address"),
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

export default function SignupPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      webhook_url: "",
      wallet_address: "",
      preferred_destination_chain: 8453, // Default to Base Mainnet
      enabled_source_chains: [8453], // Default to Base Mainnet
      description: "",
      website: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    console.log('Starting registration process...');
    
    try {
      const vendorData: CreateVendorRequest = {
        name: data.name,
        email: data.email,
        password: data.password,
        webhook_url: data.webhook_url || undefined,
        wallet_address: data.wallet_address,
        preferred_destination_chain: data.preferred_destination_chain,
        enabled_source_chains: data.enabled_source_chains,
        description: data.description || undefined,
        website: data.website || undefined,
      };

      console.log('Calling register with data:', { ...vendorData, password: '[HIDDEN]' });
      await register(vendorData);
      console.log('Registration successful, redirecting...');
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Failed to create vendor:", error);
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
      
      // Handle specific backend errors
      if (errorMessage.includes('bcrypt')) {
        setError('Server configuration error. Please contact support.');
      } else if (errorMessage.includes('duplicate key value') && errorMessage.includes('vendors_email_unique')) {
        setError('An account with this email already exists. Please use a different email or try signing in.');
      } else if (errorMessage.includes('duplicate key value') && errorMessage.includes('wallet_address')) {
        setError('This wallet address is already registered. Please use a different wallet address.');
      } else if (errorMessage.includes('Error creating vendor')) {
        // Parse nested database error messages
        const match = errorMessage.match(/Key \((\w+)\)=\(([^)]+)\) already exists/);
        if (match) {
          const [, field, value] = match;
          if (field === 'email') {
            setError(`An account with email "${value}" already exists. Please use a different email or try signing in.`);
          } else {
            setError(`The ${field} "${value}" is already in use. Please try a different value.`);
          }
        } else {
          setError('Registration failed due to a database error. Please check your information and try again.');
        }
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="text-center">
            <div className="mx-auto bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-fit mb-4">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Join as a Vendor
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Start accepting crypto payments across multiple blockchain networks. 
              Set up your vendor account to begin processing payments through our PIaaS platform.
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Vendor Registration
              </CardTitle>
              <CardDescription>
                Fill out the form below to create your vendor account and start accepting crypto payments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                      {error}
                      {error.includes('already exists') && error.includes('email') && (
                        <div className="mt-2">
                          <Link href="/login" className="text-red-800 dark:text-red-300 underline hover:no-underline">
                            Sign in with existing account →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter a secure password" {...field} />
                          </FormControl>
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
                      name="wallet_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="0x..." {...field} />
                          </FormControl>
                          <FormDescription>
                            The wallet address where you want to receive payments
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Creating Account..." : "Create Vendor Account"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
