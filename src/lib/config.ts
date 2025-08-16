export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_PROD === 'true' 
    ? 'https://crossmeter-api-2.onrender.com' 
    : 'http://localhost:8000',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'PIaaS Dashboard',
  supportedChains: [
    { id: 1, name: 'Ethereum Mainnet' },
    { id: 8453, name: 'Base Mainnet' },
    { id: 84532, name: 'Base Sepolia' },
    { id: 10, name: 'Optimism' },
    { id: 42161, name: 'Arbitrum One' },
    { id: 137, name: 'Polygon' },
  ],
  defaultTestData: {
    vendorId: 'v_123',
    productId: 'p_abc',
    customerEmail: 'alice@example.com',
  },
} as const;
