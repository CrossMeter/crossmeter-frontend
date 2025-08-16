## **Current API Integrations**

### **✅ Real Backend APIs (Working)**

**Core Infrastructure:**
- `GET /v1/router/chains` - Load supported blockchain networks
- `GET /v1/router/chains/{id}` - Get specific chain info
- `POST /v1/router/estimate` - Calculate payment costs

**Vendor Management & Authentication:**
- `POST /v1/auth/register` - Vendor registration
- `POST /v1/auth/login` - Vendor login
- `GET /v1/auth/me` - Get current vendor
- `POST /v1/vendors/{id}/regenerate-api-key` - Regenerate API key
- `GET /v1/vendors/{id}` - Get vendor details
- `PATCH /v1/vendors/{id}` - Update vendor

**Product Management:**
- `POST /v1/vendors/{vendor_id}/products/` - Create product
- `GET /v1/vendors/{vendor_id}/products/` - List vendor products
- `GET /v1/vendors/{vendor_id}/products/{product_id}` - Get product details
- `PATCH /v1/vendors/{vendor_id}/products/{product_id}` - Update product
- `DELETE /v1/vendors/{vendor_id}/products/{product_id}` - Delete product

**Payment Processing:**
- `POST /v1/payment_intents/` - Create payment intents
- `GET /v1/payment_intents/{id}` - Get payment intent details
- `GET /v1/vendors/{vendor_id}/payment_intents/` - List vendor payment intents
- `POST /v1/payment_intents/{id}/tx/source` - Submit transaction hash
- `POST /v1/payment_intents/{id}/tx/destination` - Submit destination transaction hash

**Client Payment Gateway (API Key Based):**
- `GET /v1/client/vendor` - Get vendor info via API key
- `GET /v1/client/products` - List products via API key
- `GET /v1/client/products/{id}` - Get product details via API key
- `POST /v1/client/payment` - Create payment intent via API key
- `GET /v1/client/payment/{id}` - Get payment status via API key
- `POST /v1/client/payment/{id}/submit` - Submit transaction hash via API key
- `POST /v1/client/payment/{id}/settle` - Settle payment via API key

**Subscriptions:**
- `POST /v1/subscriptions/` - Create subscription
- `GET /v1/subscriptions/{id}` - Get subscription details
- `POST /v1/subscriptions/{id}/renew` - Renew subscription
- `PATCH /v1/subscriptions/{id}/status` - Update subscription status

**Analytics & Webhooks:**
- `GET /v1/vendors/{vendor_id}/analytics` - Get vendor analytics
- `GET /v1/webhooks/events/{vendor_id}` - Get webhook events
- `POST /v1/webhooks/process` - Process pending webhooks
- `DELETE /v1/webhooks/cleanup` - Cleanup old webhook events

### **✅ Data Transformation Layer**
- Frontend types normalized to backend API format
- Automatic conversion between frontend and backend field names
- USDC minor units ↔ cents conversion
- Metadata flattening/expansion for vendor and product fields

### **❌ Not Integrated Yet**
- Customer management endpoints (not available in backend)
- Subscription listing endpoint (not available in backend)
- Real-time WebSocket notifications

**Status**: All major APIs integrated with real backend endpoints. Frontend uses data transformation layer to maintain compatibility while communicating with backend API format.