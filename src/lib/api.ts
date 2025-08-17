import axios from 'axios';
import type {
  Chain,
  Vendor,
  Product,
  Customer,
  PaymentIntent,
  Subscription,
  WebhookEvent,
  CreatePaymentIntentRequest,
  CreateSubscriptionRequest,
  CreateVendorRequest,
  CreateProductRequest,
  EstimateRequest,
  EstimateResponse,
  LoginRequest,
  AuthResponse,
  ClientVendorInfo,
  ClientProduct,
  ClientPaymentRequest,
  ClientPaymentIntent,
  ApiKeyRegenerateResponse,
  AttestationData,
  AttestationsResponse,
  UpdateAttestationStatusRequest,
  CompleteMintRequest,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_PROD === 'true' 
  ? 'https://crossmeter-api-2.onrender.com' 
  : 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('vendor_id');
  }
};

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Utility functions to normalize API data between frontend and backend formats
const normalizeChain = (chain: any): Chain => ({
  ...chain,
  id: chain.chain_id,
  bridge_fee_basis_points: chain.bridge_fee_bps,
  enabled: true, // All chains from API are enabled
});

const normalizeVendor = (vendor: any): Vendor => ({
  ...vendor,
  id: vendor.vendor_id,
  preferred_destination_chain: vendor.preferred_dest_chain_id,
  description: vendor.metadata?.description,
  website: vendor.metadata?.website,
});

const normalizeProduct = (product: any): Product => {
  // Convert backend product_type back to frontend pricing_model
  const backendToFrontendMap: Record<string, string> = {
    'one_time': 'one_off',
    'subscription': 'monthly',
    'usage_based': 'pay_per_use'
  };
  
  return {
    ...product,
    id: product.product_id,
    pricing_model: backendToFrontendMap[product.product_type] || product.product_type,
    price_cents: Math.round(product.default_amount_usdc_minor / 10000), // Convert USDC minor units to cents
    usage_limit: product.metadata?.usage_limit,
    billing_interval_days: product.metadata?.billing_interval_days,
    is_active: true, // Default to active
  };
};

const normalizePaymentIntent = (intent: any): PaymentIntent => ({
  ...intent,
  id: intent.intent_id,
  customer_id: intent.customer_email,
  amount_cents: Math.round(intent.amount_usdc_minor / 10000), // Convert USDC minor units to cents
  router_calldata: intent.router?.calldata,
  source_tx_hash: intent.tx_hashes?.source,
  destination_tx_hash: intent.tx_hashes?.destination,
  transaction_hash: intent.transaction_hash,
});

const normalizeSubscription = (subscription: any): Subscription => ({
  ...subscription,
  id: subscription.subscription_id,
  customer_id: subscription.customer_email,
  billing_interval_days: subscription.billing_interval,
  next_billing_date: subscription.next_renewal_at,
});

// Chain & Router APIs
export const chainApi = {
  getChains: async () => {
    const response = await api.get<any[]>('/v1/router/chains');
    return {
      ...response,
      data: response.data.map(normalizeChain)
    };
  },
  getChain: async (id: number) => {
    const response = await api.get<any>(`/v1/router/chains/${id}`);
    return {
      ...response,
      data: normalizeChain(response.data)
    };
  },
  estimate: (data: EstimateRequest) => api.post<EstimateResponse>('/v1/router/estimate', data),
  generateCalldata: (data: CreatePaymentIntentRequest) => api.post('/v1/router/generate-calldata', data),
  validate: (srcChainId: number, destChainId: number) => 
    api.get(`/v1/router/validate?src_chain_id=${srcChainId}&dest_chain_id=${destChainId}`),
};

// Payment Intent APIs (these use the real backend endpoints)
export const paymentIntentApi = {
  create: async (data: CreatePaymentIntentRequest) => {
    // Convert our frontend format to backend format
    const backendData = {
      vendor_id: data.vendor_id,
      product_id: data.product_id,
      src_chain_id: data.src_chain_id,
      dest_chain_id: data.dest_chain_id,
      amount_usdc_minor: data.amount_cents * 10000, // Convert cents to USDC minor units (1 cent = 10K minor units)
      customer_email: data.customer_id, // Assuming customer_id is email for now
    };
    const response = await api.post<any>('/v1/payment_intents/', backendData);
    return {
      ...response,
      data: normalizePaymentIntent(response.data)
    };
  },
  get: async (id: string) => {
    const response = await api.get<any>(`/v1/payment_intents/${id}`);
    return {
      ...response,
      data: normalizePaymentIntent(response.data)
    };
  },
  getAll: async (vendorId: string, params?: { status?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString();
    const url = `/v1/vendors/${vendorId}/payment_intents/${query ? `?${query}` : ''}`;
    const response = await api.get<any[]>(url);
    return {
      ...response,
      data: response.data.map(normalizePaymentIntent)
    };
  },
  updateSourceTx: (id: string, txHash: string) => 
    api.post(`/v1/payment_intents/${id}/tx/source`, { tx_hash: txHash }),
  updateDestinationTx: (id: string, txHash: string) => 
    api.post(`/v1/payment_intents/${id}/tx/destination`, { tx_hash: txHash }),
};

// Subscription APIs
export const subscriptionApi = {
  create: async (data: CreateSubscriptionRequest) => {
    // Convert frontend format to backend format
    const backendData = {
      vendor_id: data.vendor_id,
      customer_email: data.customer_id, // Backend expects customer_email
      product_id: data.product_id,
      plan_id: data.product_id, // Backend expects plan_id (same as product_id)
      billing_interval: 'monthly', // Backend expects enum: 'monthly', 'quarterly', 'yearly'
      amount_usdc_minor: 1000000, // Default amount - should be from product
      src_chain_id: 8453, // Default chain - this should be part of the request
      dest_chain_id: 8453, // Default chain - this should be part of the request
    };
    const response = await api.post<any>('/v1/subscriptions/', backendData);
    return {
      ...response,
      data: normalizeSubscription(response.data)
    };
  },
  get: async (id: string) => {
    const response = await api.get<any>(`/v1/subscriptions/${id}`);
    return {
      ...response,
      data: normalizeSubscription(response.data)
    };
  },
  getAll: async (vendorId?: string) => {
    // Backend doesn't have a subscription listing endpoint
    // Return empty array for now - this would need to be implemented in backend
    return { data: [] as Subscription[] };
  },
  renew: async (id: string) => {
    const response = await api.post<any>(`/v1/subscriptions/${id}/renew`);
    return {
      ...response,
      data: normalizePaymentIntent(response.data)
    };
  },
  updateStatus: (id: string, status: 'active' | 'paused' | 'cancelled') => 
    api.patch(`/v1/subscriptions/${id}/status`, { status }),
};

// Webhook APIs
export const webhookApi = {
  getEvents: (vendorId: string) => api.get<WebhookEvent[]>(`/v1/webhooks/events/${vendorId}`),
  processEvents: () => api.post('/v1/webhooks/process'),
  cleanup: () => api.delete('/v1/webhooks/cleanup'),
};

// Real Vendor APIs - now using backend endpoints
export const vendorApi = {
  getAll: async () => {
    // Note: Backend doesn't have a list all vendors endpoint
    // This would typically be an admin function
    return { data: [] as Vendor[] };
  },
  get: async (id: string) => {
    const response = await api.get<any>(`/v1/vendors/${id}`);
    return {
      ...response,
      data: normalizeVendor(response.data)
    };
  },
  create: async (data: CreateVendorRequest) => {
    // Convert frontend format to backend format
    const backendData = {
      name: data.name,
      email: data.email,
      webhook_url: data.webhook_url,
      preferred_dest_chain_id: data.preferred_destination_chain,
      enabled_source_chains: data.enabled_source_chains,
      wallet_address: data.wallet_address,
      metadata: {
        description: data.description,
        website: data.website,
      },
    };
    const response = await api.post<any>('/v1/vendors/', backendData);
    return {
      ...response,
      data: normalizeVendor(response.data)
    };
  },
  update: async (id: string, data: Partial<CreateVendorRequest>) => {
    // Convert frontend format to backend format
    const backendData: any = {};
    if (data.name) backendData.name = data.name;
    if (data.webhook_url !== undefined) backendData.webhook_url = data.webhook_url;
    if (data.enabled_source_chains) backendData.enabled_source_chains = data.enabled_source_chains;
    if (data.description || data.website) {
      backendData.metadata = {};
      if (data.description) backendData.metadata.description = data.description;
      if (data.website) backendData.metadata.website = data.website;
    }
    const response = await api.patch<any>(`/v1/vendors/${id}`, backendData);
    return {
      ...response,
      data: normalizeVendor(response.data)
    };
  },
  delete: async (id: string) => {
    // Backend doesn't have delete endpoint, vendors are typically deactivated
    throw new Error("Vendor deletion not supported by backend");
  },
  regenerateApiKey: async (vendorId: string) => {
    const response = await api.post<ApiKeyRegenerateResponse>(`/v1/vendors/${vendorId}/regenerate-api-key`);
    return response.data;
  },
};

// Real Product APIs - now using backend endpoints
export const productApi = {
  getAll: async (vendorId: string) => {
    const response = await api.get<any[]>(`/v1/vendors/${vendorId}/products/`);
    return {
      ...response,
      data: response.data.map(normalizeProduct)
    };
  },
  get: async (vendorId: string, productId: string) => {
    const response = await api.get<any>(`/v1/vendors/${vendorId}/products/${productId}`);
    return {
      ...response,
      data: normalizeProduct(response.data)
    };
  },
  create: async (data: CreateProductRequest) => {
    // Convert frontend format to backend format
    const pricingModelMap: Record<string, string> = {
      'one_off': 'one_time',
      'monthly': 'subscription', 
      'pay_per_use': 'usage_based'
    };
    
    const backendData: any = {
      name: data.name,
      product_type: pricingModelMap[data.pricing_model],
      default_amount_usdc_minor: data.price_cents * 10000, // Convert cents to USDC minor units
    };
    
    // Only include optional fields if they have values
    if (data.description) {
      backendData.description = data.description;
    }
    
    // Only include metadata if there are actual values
    const metadata: any = {};
    if (data.usage_limit !== undefined) metadata.usage_limit = data.usage_limit;
    if (data.billing_interval_days !== undefined) metadata.billing_interval_days = data.billing_interval_days;
    
    if (Object.keys(metadata).length > 0) {
      backendData.metadata = metadata;
    }
    
    console.log('Creating product with data:', backendData);
    const response = await api.post<any>(`/v1/vendors/${data.vendor_id}/products/`, backendData);
    return {
      ...response,
      data: normalizeProduct(response.data)
    };
  },
  update: async (vendorId: string, productId: string, data: Partial<CreateProductRequest>) => {
    // Convert frontend format to backend format
    const pricingModelMap: Record<string, string> = {
      'one_off': 'one_time',
      'monthly': 'subscription', 
      'pay_per_use': 'usage_based'
    };
    
    const backendData: any = {};
    if (data.name) backendData.name = data.name;
    if (data.description !== undefined) backendData.description = data.description;
    if (data.pricing_model) backendData.product_type = pricingModelMap[data.pricing_model];
    if (data.price_cents) backendData.default_amount_usdc_minor = data.price_cents * 10000;
    
    // Only include metadata if there are actual values
    const metadata: any = {};
    if (data.usage_limit !== undefined) metadata.usage_limit = data.usage_limit;
    if (data.billing_interval_days !== undefined) metadata.billing_interval_days = data.billing_interval_days;
    
    if (Object.keys(metadata).length > 0) {
      backendData.metadata = metadata;
    }
    
    console.log('Updating product with data:', backendData);
    const response = await api.patch<any>(`/v1/vendors/${vendorId}/products/${productId}`, backendData);
    return {
      ...response,
      data: normalizeProduct(response.data)
    };
  },
  delete: (vendorId: string, productId: string) => 
    api.delete(`/v1/vendors/${vendorId}/products/${productId}`),
};

// Analytics APIs
export const analyticsApi = {
  getVendorAnalytics: (vendorId: string, params?: { days?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append('days', params.days.toString());
    
    const query = queryParams.toString();
    const url = `/v1/vendors/${vendorId}/analytics${query ? `?${query}` : ''}`;
    return api.get<{
      total_revenue: number;
      total_payments: number;
      success_rate: number;
      revenue_by_product: Record<string, number>;
      payments_by_status: Record<string, number>;
      recent_activity: Array<{
        intent_id: string;
        amount: number;
        status: string;
        created_at: string;
      }>;
    }>(url);
  },
};

// Customer APIs (assuming these exist based on the schema)
export const customerApi = {
  getAll: () => api.get<Customer[]>('/customers/'),
  get: (id: string) => api.get<Customer>(`/customers/${id}`),
  create: (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<Customer>('/customers/', data),
  update: (id: string, data: Partial<Customer>) => 
    api.patch<Customer>(`/customers/${id}`, data),
};

// Authentication APIs
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/v1/auth/login', data);
    setAuthToken(response.data.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vendor_id', response.data.vendor_id);
    }
    return response.data;
  },
  register: async (data: CreateVendorRequest): Promise<AuthResponse> => {
    // Convert frontend format to backend format
    const backendData = {
      name: data.name,
      email: data.email,
      password: data.password,
      webhook_url: data.webhook_url,
      preferred_dest_chain_id: data.preferred_destination_chain,
      enabled_source_chains: data.enabled_source_chains,
      wallet_address: data.wallet_address,
      metadata: {
        description: data.description,
        website: data.website,
      },
    };
    const response = await api.post<AuthResponse>('/v1/auth/register', backendData);
    setAuthToken(response.data.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vendor_id', response.data.vendor_id);
    }
    return response.data;
  },
  me: async (): Promise<Vendor> => {
    const response = await api.get<any>('/v1/auth/me');
    return normalizeVendor(response.data);
  },
  logout: () => {
    removeAuthToken();
  },
  getCurrentVendorId: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vendor_id');
    }
    return null;
  },
  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },
};

// Client API Functions (for payment gateway)
export const clientApi = {
  getVendorInfo: async (apiKey: string): Promise<ClientVendorInfo> => {
    const response = await axios.get<ClientVendorInfo>(`${API_BASE_URL}/v1/client/vendor`, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  getProducts: async (apiKey: string): Promise<ClientProduct[]> => {
    const response = await axios.get<ClientProduct[]>(`${API_BASE_URL}/v1/client/products`, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  getProduct: async (apiKey: string, productId: string): Promise<ClientProduct> => {
    const response = await axios.get<ClientProduct>(`${API_BASE_URL}/v1/client/products/${productId}`, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  createPayment: async (apiKey: string, paymentData: ClientPaymentRequest): Promise<ClientPaymentIntent> => {
    const response = await axios.post<ClientPaymentIntent>(`${API_BASE_URL}/v1/client/payment`, paymentData, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  getPaymentStatus: async (apiKey: string, paymentId: string): Promise<ClientPaymentIntent> => {
    const response = await axios.get<ClientPaymentIntent>(`${API_BASE_URL}/v1/client/payment/${paymentId}`, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  submitPayment: async (apiKey: string, paymentId: string, txHash: string): Promise<ClientPaymentIntent> => {
    const response = await axios.post<ClientPaymentIntent>(`${API_BASE_URL}/v1/client/payment/${paymentId}/submit`, 
      { tx_hash: txHash }, 
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  settlePayment: async (apiKey: string, paymentId: string): Promise<ClientPaymentIntent> => {
    const response = await axios.post<ClientPaymentIntent>(`${API_BASE_URL}/v1/client/payment/${paymentId}/settle`, 
      {}, 
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },
};

// Circle CCTP Attestations API - using local Next.js API routes with Supabase
export const circleApi = {
  getPendingAttestations: async (vendorAddress: string, status?: string): Promise<AttestationsResponse> => {
    const url = new URL('/api/attestations/pending', window.location.origin);
    url.searchParams.append('vendorAddress', vendorAddress);
    if (status) {
      url.searchParams.append('status', status);
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch attestations: ${response.statusText}`);
    }
    return response.json();
  },

  updateAttestationStatus: async (data: UpdateAttestationStatusRequest): Promise<{ success: boolean }> => {
    const response = await fetch('/api/attestations/pending', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update attestation: ${response.statusText}`);
    }
    return response.json();
  },

  storeAttestation: async (data: {
    paymentIntentId: string;
    attestation: string;
    messageHash: string;
    originalMessage: string;
    amount: number;
    sourceChain: string;
    destinationChain: string;
    vendorAddress: string;
    recipientAddress: string;
    burnTxHash: string;
    customerAddress: string;
  }): Promise<{ success: boolean; attestationId: string }> => {
    const response = await fetch('/api/attestations/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to store attestation: ${response.statusText}`);
    }
    return response.json();
  },
};

export { getAuthToken, setAuthToken, removeAuthToken };
export default api;
