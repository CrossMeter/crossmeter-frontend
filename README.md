# PIaaS Frontend - Payment Infrastructure as a Service

A modern Next.js frontend for the crypto payment processing platform, built with TypeScript, Tailwind CSS, and shadcn/ui components.

## Overview

This frontend provides a complete interface for the PIaaS backend, allowing vendors to manage crypto payments across 6 major blockchain networks and customers to make seamless cross-chain payments.

## Features

### 🏠 Landing Page
- Modern, responsive design with feature highlights
- Overview of supported blockchain networks
- Quick access to vendor dashboard and payment interface

### 📊 Vendor Dashboard
- Real-time payment intent tracking
- Subscription management
- Webhook event monitoring
- Revenue analytics and statistics
- Status badges for payment lifecycle tracking

### 💳 Customer Payment Interface
- Multi-chain payment support (6 networks)
- Real-time cost estimation with bridge fees
- Chain selection and validation
- Smart contract integration with calldata generation
- Transaction hash submission and tracking

### 🔗 Network Management
- Comprehensive chain information display
- Payment cost calculator
- Bridge fee visualization
- Gas limit and contract address details
- Network status monitoring

### 🔔 Webhook Management
- Event delivery tracking
- Retry mechanism monitoring
- Payload inspection
- Manual webhook processing
- Event cleanup utilities

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Vendor dashboard
│   ├── pay/               # Customer payment interface
│   ├── chains/            # Network information
│   ├── webhooks/          # Webhook management
│   └── layout.tsx         # Root layout with navigation
├── components/
│   ├── ui/                # shadcn/ui components
│   └── navigation.tsx     # Main navigation component
└── lib/
    ├── api.ts             # API client functions
    ├── types.ts           # TypeScript type definitions
    ├── config.ts          # Configuration constants
    └── utils.ts           # Utility functions
```

## Supported Blockchain Networks

1. **Ethereum Mainnet** (Chain ID: 1)
2. **Base Mainnet** (Chain ID: 8453)
3. **Base Sepolia** (Chain ID: 84532) - Testnet
4. **Optimism** (Chain ID: 10)
5. **Arbitrum One** (Chain ID: 42161)
6. **Polygon** (Chain ID: 137)

## API Integration

The frontend connects to the PIaaS backend at `https://crossmeter-api-2.onrender.com` with the following endpoints:

### Payment Intents
- `POST /v1/payment_intents/` - Create payment intent
- `GET /v1/payment_intents/{id}` - Get payment details
- `POST /v1/payment_intents/{id}/tx/source` - Submit source transaction

### Subscriptions
- `POST /v1/subscriptions/` - Create subscription
- `GET /v1/subscriptions/{id}` - Get subscription details
- `POST /v1/subscriptions/{id}/renew` - Renew subscription

### Router & Chains
- `GET /v1/router/chains` - List supported chains
- `POST /v1/router/estimate` - Calculate payment costs
- `POST /v1/router/generate-calldata` - Generate smart contract data

### Webhooks
- `GET /v1/webhooks/events/{vendor_id}` - Get webhook events
- `POST /v1/webhooks/process` - Process pending webhooks

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PIaaS backend running at crossmeter-api-2.onrender.com

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Add shadcn/ui components
npx shadcn@latest add [component-name]
```

## Configuration

The application uses the following configuration in `src/lib/config.ts`:

```typescript
export const config = {
  apiBaseUrl: 'https://crossmeter-api-2.onrender.com',
  appName: 'PIaaS Dashboard',
  defaultTestData: {
    vendorId: 'v_123',
    productId: 'p_abc',
    customerEmail: 'alice@example.com',
  },
  // ... supported chains
};
```

## Key Features in Detail

### Payment Flow
1. Customer selects source and destination chains
2. System calculates bridge fees and gas estimates
3. Payment intent created with smart contract calldata
4. Customer submits transaction hash after wallet interaction
5. System monitors transaction status and sends webhooks

### Chain Support
- Automatic chain validation for supported combinations
- Real-time bridge fee calculation based on chain-specific rates
- Gas limit optimization per network
- Contract address management for routers and USDC tokens

### Webhook System
- Real-time delivery status monitoring
- Automatic retry mechanism (up to 3 attempts)
- Exponential backoff for failed deliveries
- Payload inspection and debugging tools

## Design System

The UI uses a consistent design system with:
- **Colors**: Blue/indigo primary theme with semantic status colors
- **Typography**: Geist Sans for headings, Geist Mono for code
- **Spacing**: Tailwind's spacing scale
- **Components**: shadcn/ui for consistent, accessible components
- **Icons**: Lucide React for a comprehensive icon set

## Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Adaptive navigation and layout
- Touch-friendly interactions

## Error Handling

- Comprehensive error boundaries
- API error handling with user-friendly messages
- Loading states for all async operations
- Form validation with real-time feedback

## Performance

- Server-side rendering with Next.js
- Optimized bundle splitting
- Lazy loading for heavy components
- Efficient re-renders with React hooks

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Modern mobile browsers

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new components
3. Add proper error handling and loading states
4. Include responsive design considerations
5. Test across different screen sizes and browsers

## Deployment

The application can be deployed to any platform that supports Next.js:

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t piaas-frontend .
docker run -p 3000:3000 piaas-frontend
```

### Static Export
```bash
npm run build
npm run export
```

## Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_API_BASE_URL=https://crossmeter-api-2.onrender.com
NEXT_PUBLIC_APP_NAME="PIaaS Dashboard"
```

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please contact the development team or create an issue in the repository.