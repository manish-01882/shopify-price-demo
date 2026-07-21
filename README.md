# Shopify ZIP Code–Based Product Pricing Demo

A demo Shopify application that shows location-based pricing on product pages. Customers enter a ZIP code and instantly see a price tailored to their location.

![Architecture](docs/architecture-diagram.png)

## 🎯 Features

- **ZIP code input** on the Shopify product page
- **Real-time price lookup** via backend API
- **3 demo ZIP codes** with different prices:
  | ZIP Code | Region | Price |
  |----------|--------|-------|
  | 75028 | Texas (DFW Area) | $1,499 |
  | 10001 | New York (Manhattan) | $1,699 |
  | 90210 | Beverly Hills, CA | $1,799 |
  | Other | Standard | $1,599 |
- **Beautiful UI** with animations, loading states, and error handling
- **Responsive design** works on desktop and mobile

## 🏗️ Architecture

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│   Shopify Storefront        │     │   Backend API (Express.js)   │
│   (Dawn Theme)              │     │   Hosted on Railway/Render   │
│                             │     │                              │
│   ┌───────────────────────┐ │     │   GET /api/price             │
│   │ Custom Liquid Section │ │     │     ?zip=75028               │
│   │                       │ │     │     &product_id=123          │
│   │  [ZIP Input] [Check]  │─┼────▶│                              │
│   │                       │ │     │   Pricing Rules Engine        │
│   │  Price: $1,499        │◀┼─────│   (Hardcoded ZIP → Price)    │
│   │  Texas (DFW Area)     │ │     │                              │
│   └───────────────────────┘ │     │   Returns JSON:              │
│                             │     │   { price, region, found }   │
└─────────────────────────────┘     └──────────────────────────────┘
```

### How It Works

1. Customer opens a Shopify product page
2. A **Custom Liquid section** renders a ZIP code input next to the price
3. Customer enters a ZIP code and clicks **"Check Price"**
4. JavaScript sends a `GET` request to the backend API
5. The backend looks up the ZIP code in its pricing rules
6. The price and region are returned as JSON
7. The UI animates to display the location-based price
8. Customer can enter another ZIP code to see updated pricing

### How Shopify API Calls Work

The storefront communicates with the backend via a simple REST API call:

```
GET https://<backend-url>/api/price?zip=75028&product_id=123
```

**Response:**
```json
{
  "price": 1499,
  "formattedPrice": "$1,499",
  "zip": "75028",
  "region": "Texas (DFW Area)",
  "productId": "123",
  "found": true
}
```

> **Note:** In a production Shopify app, this API call would go through a **Shopify App Proxy** (e.g., `https://store.myshopify.com/apps/zip-pricer/api/price`), which adds HMAC signature verification for security. For this demo, we use direct API calls with CORS.

## 📁 Project Structure

```
shopify-price-demo/
├── backend/                    # Express.js pricing API
│   ├── server.js              # Main server with pricing rules
│   ├── package.json           # Dependencies
│   ├── .env.example           # Environment template
│   └── .gitignore
├── storefront/                 # Shopify storefront code
│   └── zip-price-checker.liquid  # Custom Liquid section (paste into Theme Editor)
├── docs/
│   └── architecture.md        # Detailed architecture documentation
└── README.md                  # This file
```

## 🚀 Setup Instructions

### 1. Backend API

```bash
# Install dependencies
cd backend
npm install

# Create .env file
cp .env.example .env

# Start the server
npm start
# Server runs on http://localhost:3000
```

**Test locally:**
```bash
curl "http://localhost:3000/api/price?zip=75028&product_id=123"
```

### 2. Deploy Backend

Deploy the `backend/` directory to any Node.js hosting platform:

- **Railway**: Connect GitHub repo → set root to `backend/` → auto-deploy
- **Render**: New Web Service → connect repo → set root to `backend/`
- **Vercel**: Can also work as serverless functions

### 3. Shopify Store Setup

1. Create a [Shopify Partner account](https://partners.shopify.com/) (free)
2. Create a **development store**
3. Add at least one sample product (e.g., "Premium Smart TV 65-inch" at $1,599)
4. Go to **Online Store → Themes → Customize**
5. Navigate to the **Product page** template
6. Click **"Add section"** → **"Custom Liquid"**
7. Copy the contents of `storefront/zip-price-checker.liquid` and paste it
8. **Update the `API_BASE_URL`** in the JavaScript to your deployed backend URL
9. Position the section near the product price
10. Click **Save**

### 4. Test

Visit your product page and try these ZIP codes:
- `75028` → $1,499 (Texas)
- `10001` → $1,699 (New York)
- `90210` → $1,799 (Beverly Hills)
- `99999` → $1,599 (Standard/default)

## 🔧 API Reference

### `GET /api/price`
Returns pricing for a ZIP code.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `zip` | string | Yes | 5-digit US ZIP code |
| `product_id` | string | No | Shopify product/variant ID |

### `GET /api/rules`
Lists all configured pricing rules.

### `GET /health`
Health check endpoint.

## 🏛️ Production Architecture

For a production Shopify app, you would use:

| Component | Demo | Production |
|-----------|------|------------|
| Frontend | Custom Liquid (pasted) | Theme App Extension (via Shopify CLI) |
| Backend | Express on Railway | Remix app on Vercel (Shopify-managed) |
| Communication | Direct API call (CORS) | App Proxy (HMAC-signed) |
| Auth | None | Shopify OAuth |
| Data | Hardcoded rules | Database (PostgreSQL) |

See [docs/architecture.md](docs/architecture.md) for the full production architecture comparison.

## ⏱️ Build Time

This project was built in approximately **1 hour**, including:
- Backend API development and testing (~15 min)
- Storefront UI with animations and responsive design (~20 min)
- Deployment and Shopify store configuration (~15 min)
- Testing and documentation (~10 min)
