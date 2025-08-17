// Types based on the backend schemas

export interface Chain {
  chain_id: number;
  name: string;
  enabled?: boolean;
  router_address: string;
  usdc_address: string;
  bridge_fee_bps: number;
  gas_limit: number;
  // Computed properties for compatibility
  id?: number;
  bridge_fee_basis_points?: number;
}

export interface Vendor {
  vendor_id: string; // Backend uses vendor_id as the field name
  name: string;
  email: string;
  webhook_url?: string;
  enabled_source_chains: number[];
  preferred_dest_chain_id: number; // Backend uses this field name
  wallet_address: string;
  api_key?: string; // API key for client access
  metadata?: {
    description?: string;
    website?: string;
  };
  created_at: string;
  updated_at: string;
  // Frontend compatibility properties
  id?: string;
  preferred_destination_chain?: number;
  description?: string;
  website?: string;
}

export type PricingModel = 'one_off' | 'monthly' | 'pay_per_use';
export type BackendProductType = 'one_time' | 'subscription' | 'usage_based';

export interface Product {
  product_id: string; // Backend uses product_id as the field name
  vendor_id: string;
  name: string;
  description?: string;
  product_type: PricingModel; // Backend uses product_type instead of pricing_model
  default_amount_usdc_minor: number; // Backend uses USDC minor units
  metadata?: {
    usage_limit?: number; // for pay-per-use
    billing_interval_days?: number; // for subscriptions
  };
  created_at: string;
  updated_at: string;
  // Frontend compatibility properties
  id?: string;
  pricing_model?: PricingModel;
  price_cents?: number;
  usage_limit?: number;
  billing_interval_days?: number;
  is_active?: boolean;
}

export interface Customer {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export type PaymentIntentStatus = 'created' | 'settled' | 'failed';

export interface PaymentIntent {
  intent_id: string; // Backend uses intent_id as the field name
  vendor_id: string;
  product_id: string;
  customer_email?: string; // Backend uses customer_email
  amount_usdc_minor: number; // Backend uses USDC minor units
  src_chain_id: number;
  dest_chain_id: number;
  status: PaymentIntentStatus;
  transaction_hash?: string; // Direct transaction hash from the database
  router?: {
    address: string;
    chain_id: number;
    function: string;
    calldata: string;
  };
  tx_hashes?: {
    source?: string;
    destination?: string;
  };
  created_at: string;
  updated_at?: string;
  // Frontend compatibility properties
  id?: string;
  customer_id?: string;
  amount_cents?: number;
  router_calldata?: string;
  source_tx_hash?: string;
  destination_tx_hash?: string;
}

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Subscription {
  subscription_id: string; // Backend uses subscription_id as the field name
  vendor_id: string;
  product_id: string;
  customer_email?: string; // Backend uses customer_email
  status: SubscriptionStatus;
  billing_interval: number; // Backend uses billing_interval instead of billing_interval_days
  next_renewal_at: string; // Backend uses next_renewal_at instead of next_billing_date
  created_at: string;
  updated_at?: string;
  // Frontend compatibility properties
  id?: string;
  customer_id?: string;
  billing_interval_days?: number;
  next_billing_date?: string;
}

export interface WebhookEvent {
  id: string;
  vendor_id: string;
  event_type: string;
  payload: Record<string, any>;
  attempts: number;
  last_attempt_at?: string;
  status: 'pending' | 'delivered' | 'failed';
  created_at: string;
}

export interface CreatePaymentIntentRequest {
  vendor_id: string;
  product_id: string;
  customer_id: string;
  src_chain_id: number;
  dest_chain_id: number;
  amount_cents: number;
}

export interface CreateSubscriptionRequest {
  vendor_id: string;
  product_id: string;
  customer_id: string;
  billing_interval_days: number;
}

export interface EstimateRequest {
  amount_cents: number;
  src_chain_id: number;
  dest_chain_id: number;
}

export interface EstimateResponse {
  base_amount: number;
  bridge_fee: number;
  total_amount: number;
  gas_estimate: number;
}

export interface CreateVendorRequest {
  name: string;
  email: string;
  password: string; // Added for registration
  webhook_url?: string;
  enabled_source_chains: number[];
  preferred_destination_chain: number;
  wallet_address: string;
  description?: string;
  website?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  vendor_id: string;
}

export interface CreateProductRequest {
  vendor_id: string;
  name: string;
  description?: string;
  pricing_model: PricingModel;
  price_cents: number;
  usage_limit?: number;
  billing_interval_days?: number;
}

// Client API Types (for payment gateway)
export interface ClientVendorInfo {
  vendor_id: string;
  name: string;
  wallet_address: string;
  enabled_source_chains: number[];
  preferred_dest_chain_id: number;
}

export interface ClientProduct {
  product_id: string;
  name: string;
  description?: string;
  product_type: string;
  default_amount_usdc_minor: number;
}

export interface ClientPaymentRequest {
  product_id: string;
  customer_email: string;
  src_chain_id: number;
  dest_chain_id: number;
  amount_usdc_minor?: number; // Optional override
}

export interface ClientPaymentIntent {
  intent_id: string;
  vendor_id: string;
  product_id: string;
  customer_email: string;
  amount_usdc_minor: number;
  src_chain_id: number;
  dest_chain_id: number;
  status: PaymentIntentStatus;
  router?: {
    address: string;
    chain_id: number;
    function: string;
    calldata: string;
  };
  tx_hashes?: {
    source?: string;
    destination?: string;
  };
  created_at: string;
}

export interface ApiKeyRegenerateResponse {
  api_key: string;
}
