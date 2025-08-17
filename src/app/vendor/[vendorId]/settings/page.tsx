"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings,
  ArrowLeft,
  Loader2,
  Save,
  Wallet,
  Globe,
  Mail,
  Shield,
  CheckCircle
} from "lucide-react";
import { vendorApi, chainApi } from "@/lib/api";
import type { Vendor, Chain } from "@/lib/types";

const profileSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  description: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

const paymentSchema = z.object({
  wallet_address: z.string().min(42, "Please enter a valid wallet address").max(42, "Please enter a valid wallet address"),
  preferred_destination_chain: z.string().min(1, "Please select a preferred chain"),
  enabled_source_chains: z.array(z.string()).min(1, "Please select at least one source chain"),
});

const webhookSchema = z.object({
  webhook_url: z.string().url("Please enter a valid webhook URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;
type WebhookFormData = z.infer<typeof webhookSchema>;

export default function VendorSettingsPage() {
  const params = useParams();
  const vendorId = params.vendorId as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [chainsLoading, setChainsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      description: "",
      website: "",
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      wallet_address: "",
      preferred_destination_chain: "",
      enabled_source_chains: [],
    },
  });

  const webhookForm = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      webhook_url: "",
    },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setChainsLoading(true);
      const [vendorRes, chainsRes] = await Promise.all([
        vendorApi.get(vendorId),
        chainApi.getChains(),
      ]);
      
      const vendorData = vendorRes.data;
      setVendor(vendorData);
      setChains(chainsRes.data);

      // Populate forms
      profileForm.reset({
        name: vendorData.name,
        email: vendorData.email,
        description: vendorData.description || "",
        website: vendorData.website || "",
      });

      paymentForm.reset({
        wallet_address: vendorData.wallet_address,
        preferred_destination_chain: vendorData.preferred_destination_chain?.toString(),
        enabled_source_chains: vendorData.enabled_source_chains.map(id => id.toString()),
      });

      webhookForm.reset({
        webhook_url: vendorData.webhook_url || "",
      });

    } catch (error) {
      console.error("Failed to load vendor data:", error);
      // Fallback to hardcoded chains if API fails
      setChains([
        { chain_id: 1, id: 1, name: "Ethereum Mainnet", enabled: true, router_address: "", usdc_address: "", bridge_fee_bps: 500, bridge_fee_basis_points: 500, gas_limit: 200000 },
        { chain_id: 8453, id: 8453, name: "Base Mainnet", enabled: true, router_address: "", usdc_address: "", bridge_fee_bps: 300, bridge_fee_basis_points: 300, gas_limit: 150000 },
        { chain_id: 84532, id: 84532, name: "Base Sepolia", enabled: true, router_address: "", usdc_address: "", bridge_fee_bps: 300, bridge_fee_basis_points: 300, gas_limit: 150000 },
        { chain_id: 10, id: 10, name: "Optimism", enabled: true, router_address: "", usdc_address: "", bridge_fee_bps: 400, bridge_fee_basis_points: 400, gas_limit: 180000 },
        { chain_id: 42161, id: 42161, name: "Arbitrum One", enabled: true, router_address: "", usdc_address: "", bridge_fee_bps: 350, bridge_fee_basis_points: 350, gas_limit: 170000 },
        { chain_id: 137, id: 137, name: "Polygon", enabled: true, router_address: "", usdc_address: "", bridge_fee_bps: 600, bridge_fee_basis_points: 600, gas_limit: 220000 },
      ]);
    } finally {
      setLoading(false);
      setChainsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vendorId]);

  const saveProfile = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      await vendorApi.update(vendorId, {
        name: data.name,
        email: data.email,
        description: data.description || undefined,
        website: data.website || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadData();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const savePaymentSettings = async (data: PaymentFormData) => {
    setSaving(true);
    try {
      await vendorApi.update(vendorId, {
        wallet_address: data.wallet_address,
        preferred_destination_chain: parseInt(data.preferred_destination_chain),
        enabled_source_chains: data.enabled_source_chains.map(id => parseInt(id)),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadData();
    } catch (error) {
      console.error("Failed to update payment settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveWebhookSettings = async (data: WebhookFormData) => {
    setSaving(true);
    try {
      await vendorApi.update(vendorId, {
        webhook_url: data.webhook_url || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadData();
    } catch (error) {
      console.error("Failed to update webhook settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Vendor not found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/vendor/${vendorId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Vendor Settings</h1>
            <p className="text-muted-foreground">
              Manage your business profile and payment configuration
            </p>
          </div>
        </div>
        
        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Business Profile
              </CardTitle>
              <CardDescription>
                Update your business information and public details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Business Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your business and what you sell..."
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This will help customers understand your business
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourwebsite.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your business website or landing page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
              <CardDescription>
                Configure your wallet address and supported blockchain networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(savePaymentSettings)} className="space-y-6">
                  
                  <FormField
                    control={paymentForm.control}
                    name="wallet_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Address *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0x..." 
                            className="font-mono"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The wallet address where you want to receive payments. Make sure you control this address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="preferred_destination_chain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Destination Chain *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select where you want to receive payments" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {chains.map((chain) => (
                              <SelectItem key={chain.id} value={chain.id?.toString() || ""}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    [1, 8453, 10, 42161, 137].includes(chain.id || 0) 
                                      ? "bg-green-500" 
                                      : "bg-yellow-500"
                                  }`} />
                                  {chain.name} ({chain.id})
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Cross-chain payments will be bridged to this chain. Lower bridge fees apply for mainnet chains.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="enabled_source_chains"
                    render={() => (
                      <FormItem>
                        <FormLabel>Accepted Source Chains *</FormLabel>
                        <FormDescription className="mb-4">
                          Select which chains your customers can pay from. More options increase conversion.
                        </FormDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {chains.map((chain) => (
                            <FormField
                              key={chain.id}
                              control={paymentForm.control}
                              name="enabled_source_chains"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={chain.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(chain.id?.toString() || "")}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, chain.id?.toString() || ""])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== chain.id?.toString()
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="flex items-center gap-2 font-normal">
                                        <div className={`w-2 h-2 rounded-full ${
                                          [1, 8453, 10, 42161, 137].includes(chain.id || 0) 
                                            ? "bg-green-500" 
                                            : "bg-yellow-500"
                                        }`} />
                                        {chain.name}
                                      </FormLabel>
                                      <p className="text-xs text-muted-foreground">
                                        Chain ID: {chain.id} • Bridge Fee: {((chain.bridge_fee_basis_points || chain.bridge_fee_bps) / 100).toFixed(2)}%
                                      </p>
                                    </div>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Payment Settings
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Webhook Settings */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Configure webhook notifications for payment events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...webhookForm}>
                <form onSubmit={webhookForm.handleSubmit(saveWebhookSettings)} className="space-y-6">
                  
                  <FormField
                    control={webhookForm.control}
                    name="webhook_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourapi.com/webhooks/piaas" {...field} />
                        </FormControl>
                        <FormDescription>
                          We&apos;ll send POST requests to this URL when payment events occur. Leave empty to disable webhooks.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Webhook Events
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>payment_intent.created</strong> - New payment intent generated</li>
                      <li>• <strong>payment_intent.submitted</strong> - Source transaction confirmed</li>
                      <li>• <strong>payment_intent.settled</strong> - Destination transaction confirmed</li>
                      <li>• <strong>subscription.renewed</strong> - Subscription payment completed</li>
                    </ul>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                      Webhooks are retried up to 3 times with exponential backoff. Timeout is 30 seconds.
                    </p>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Webhook Settings
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Access
              </CardTitle>
              <CardDescription>
                Manage security settings and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <h4 className="font-medium">Vendor Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium">Vendor ID</p>
                    <p className="text-xs font-mono text-muted-foreground">{vendor.id}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                  Security Best Practices
                </h4>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• Use a dedicated wallet address for receiving payments</li>
                  <li>• Verify webhook signatures in production (implement HMAC validation)</li>
                  <li>• Monitor your webhook endpoint for unusual activity</li>
                  <li>• Keep your API integration secure and up-to-date</li>
                  <li>• Never share your vendor ID publicly unless necessary</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                  Danger Zone
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Irreversible actions that will affect your vendor account and all associated data.
                </p>
                <Button variant="destructive" disabled>
                  Delete Vendor Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Contact support to delete your account. This action cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
