# Architecture — Shopify ZIP Code Pricing Demo

## Overview

This document explains the architecture of the Shopify ZIP Code Pricing Demo, how the Shopify storefront communicates with the backend API, and how this demo maps to a production-grade Shopify app.

---

## Demo Architecture

```
                    SHOPIFY STOREFRONT
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    │  Product Page (Dawn Theme)              │
                    │  ┌─────────────────────────────────┐    │
                    │  │ Custom Liquid Section            │    │
                    │  │                                  │    │
                    │  │  ┌──────────┐ ┌──────────────┐  │    │
                    │  │  │ ZIP Input│ │ Check Price  │  │    │
                    │  │  └──────────┘ └──────┬───────┘  │    │
                    │  │                      │          │    │
                    │  │  ┌───────────────────▼────────┐ │    │
                    │  │  │ Price: $1,499              │ │    │
                    │  │  │ Region: Texas (DFW Area)   │ │    │
                    │  │  └────────────────────────────┘ │    │
                    │  └─────────────────────────────────┘    │
                    │                                         │
                    └────────────────┬────────────────────────┘
                                     │
                        fetch() GET request
                        (CORS-enabled)
                                     │
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │  BACKEND API (Express.js on Railway)    │
                    │                                         │
                    │  GET /api/price?zip=75028&product_id=1  │
                    │                                         │
                    │  ┌─────────────────────────────────┐    │
                    │  │ Pricing Rules Engine             │    │
                    │  │                                  │    │
                    │  │ 75028 → $1,499 (Texas)          │    │
                    │  │ 10001 → $1,699 (New York)       │    │
                    │  │ 90210 → $1,799 (Beverly Hills)  │    │
                    │  │ other → $1,599 (Standard)       │    │
                    │  └─────────────────────────────────┘    │
                    │                                         │
                    │  Response: JSON { price, region, ... }  │
                    └─────────────────────────────────────────┘
```

### Data Flow (Step by Step)

1. **Customer visits product page** — Shopify renders the Dawn theme with the Custom Liquid section embedded
2. **Customer enters ZIP code** — JavaScript validates the 5-digit format client-side
3. **Customer clicks "Check Price"** — JavaScript sends:
   ```
   GET https://backend-url/api/price?zip=75028&product_id=premium-smart-tv
   ```
4. **Backend processes request** — Express server:
   - Validates the ZIP code format
   - Looks up the pricing rule in the hardcoded `PRICING_RULES` object
   - Returns the matched price (or default if not found)
5. **Response received** — JSON response:
   ```json
   {
     "price": 1499,
     "formattedPrice": "$1,499",
     "zip": "75028",
     "region": "Texas (DFW Area)",
     "productId": "premium-smart-tv",
     "found": true
   }
   ```
6. **UI updates** — JavaScript animates the price display with a fade-in effect

### Technologies Used

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Storefront UI | HTML + CSS + Vanilla JS | ZIP code input, button, price display |
| Injection Method | Shopify Custom Liquid Section | No theme code editing required |
| Backend | Express.js (Node.js) | REST API for pricing rules |
| Hosting | Railway (free tier) | Zero-config Node.js deployment |
| Communication | fetch() with CORS | Client-side HTTP requests |

---

## Production Architecture (How a Real Shopify App Would Work)

In a production Shopify app, the architecture includes additional layers for security, packaging, and distribution:

```
                    SHOPIFY STOREFRONT
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    │  Product Page (Any Theme 2.0)           │
                    │  ┌─────────────────────────────────┐    │
                    │  │ Theme App Extension (App Block) │    │
                    │  │ (Installed via Shopify App)      │    │
                    │  │                                  │    │
                    │  │  [ZIP Input] [Check Price]       │    │
                    │  │  Price: $1,499                   │    │
                    │  └─────────────────────────────────┘    │
                    │                                         │
                    └────────────────┬────────────────────────┘
                                     │
                        fetch() POST request to
                        /apps/zip-pricer/api/price
                        (same-origin, no CORS needed)
                                     │
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │  SHOPIFY APP PROXY                      │
                    │  (Built-in Shopify infrastructure)      │
                    │                                         │
                    │  • Adds HMAC signature to request       │
                    │  • Routes: /apps/zip-pricer/* → backend │
                    │  • No CORS issues (same domain)         │
                    └────────────────┬────────────────────────┘
                                     │
                        Forwarded request with
                        HMAC signature
                                     │
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │  APP BACKEND (Remix on Vercel)          │
                    │                                         │
                    │  1. Validate HMAC signature             │
                    │  2. Query database for pricing rules    │
                    │  3. Return price                        │
                    │                                         │
                    │  ┌─────────────────────────────────┐    │
                    │  │ PostgreSQL Database              │    │
                    │  │ (Neon/Supabase)                  │    │
                    │  │                                  │    │
                    │  │ pricing_rules table:             │    │
                    │  │ zip | region | price | product   │    │
                    │  └─────────────────────────────────┘    │
                    └─────────────────────────────────────────┘
```

### Key Differences: Demo vs. Production

| Aspect | Demo (This Project) | Production App |
|--------|-------------------|---------------|
| **Frontend** | Custom Liquid (pasted manually) | Theme App Extension (packaged, installable) |
| **Backend** | Standalone Express server | Remix app (Shopify CLI scaffolded) |
| **Communication** | Direct CORS-enabled fetch() | App Proxy (HMAC-signed, same-origin) |
| **Security** | Open API (CORS allows all for demo) | HMAC signature validation on every request |
| **Authentication** | None | Shopify OAuth (install flow) |
| **Data Storage** | Hardcoded JavaScript object | PostgreSQL database |
| **Deployment** | Any Node.js host (Railway) | Shopify-compatible host (Vercel) |
| **Install/Uninstall** | Manual paste/remove | Clean app install/uninstall lifecycle |
| **Theme Compatibility** | Dawn only (manual placement) | Any Theme 2.0 theme (drag & drop via Theme Editor) |
| **Distribution** | N/A | Shopify App Store or custom install link |

### Why the Demo Approach Still Demonstrates the Architecture

1. **Same data flow**: ZIP → API → Price response → UI update
2. **Same separation of concerns**: Frontend (presentation) vs. Backend (business logic)
3. **Same REST API contract**: The endpoint signature is identical
4. **Demonstrates understanding**: Shows knowledge of how Shopify apps communicate, even without the full packaging overhead

### What Would Be Needed for Production

1. **Shopify CLI scaffolding**: `npm init @shopify/app@latest` to create a Remix-based app
2. **Theme App Extension**: Use `shopify app generate extension --type theme_app_extension` to create a packaged app block
3. **App Proxy configuration**: Add `[app_proxy]` to `shopify.app.toml` for secure routing
4. **HMAC validation**: Use `authenticate.public.appProxy()` to verify request authenticity
5. **Database**: Replace hardcoded rules with PostgreSQL (Prisma ORM)
6. **OAuth**: Shopify handles this via the Remix app template
7. **Admin UI**: Build an admin dashboard for merchants to configure pricing rules
