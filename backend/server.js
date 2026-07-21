require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// CORS — allow requests from any Shopify storefront (*.myshopify.com) and
// localhost for development.
// ---------------------------------------------------------------------------
const allowedOrigins = [
  /\.myshopify\.com$/,
  /localhost/,
  /127\.0\.0\.1/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((pattern) => pattern.test(origin))) {
        return callback(null, true);
      }
      return callback(null, true); // For demo purposes, allow all origins
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// ---------------------------------------------------------------------------
// Pricing Rules Engine
// ---------------------------------------------------------------------------
// In a production app, these would come from a database. For this demo,
// we use hardcoded rules that map ZIP codes to prices.
// ---------------------------------------------------------------------------
const PRICING_RULES = {
  "75028": {
    price: 1499,
    formattedPrice: "$1,499",
    region: "Texas (DFW Area)",
  },
  "10001": {
    price: 1699,
    formattedPrice: "$1,699",
    region: "New York (Manhattan)",
  },
  "90210": {
    price: 1799,
    formattedPrice: "$1,799",
    region: "Beverly Hills, CA",
  },
};

const DEFAULT_PRICING = {
  price: 1599,
  formattedPrice: "$1,599",
  region: "Standard",
};

// ---------------------------------------------------------------------------
// GET /api/price — Returns a price based on ZIP code and product ID.
//
// Query Parameters:
//   - zip (required): 5-digit US ZIP code
//   - product_id (optional): Shopify product/variant ID
//
// Response:
//   {
//     "price": 1499,
//     "formattedPrice": "$1,499",
//     "zip": "75028",
//     "region": "Texas (DFW Area)",
//     "productId": "123",
//     "found": true
//   }
// ---------------------------------------------------------------------------
app.get("/api/price", (req, res) => {
  const { zip, product_id } = req.query;

  // Validate ZIP code
  if (!zip) {
    return res.status(400).json({
      error: "Missing required parameter: zip",
      example: "/api/price?zip=75028&product_id=123",
    });
  }

  const cleanZip = zip.trim();

  if (!/^\d{5}$/.test(cleanZip)) {
    return res.status(400).json({
      error: "Invalid ZIP code format. Please enter a 5-digit US ZIP code.",
      received: zip,
    });
  }

  // Look up pricing
  const rule = PRICING_RULES[cleanZip];

  if (rule) {
    return res.json({
      price: rule.price,
      formattedPrice: rule.formattedPrice,
      zip: cleanZip,
      region: rule.region,
      productId: product_id || null,
      found: true,
    });
  }

  // Default price for unknown ZIP codes
  return res.json({
    price: DEFAULT_PRICING.price,
    formattedPrice: DEFAULT_PRICING.formattedPrice,
    zip: cleanZip,
    region: DEFAULT_PRICING.region,
    productId: product_id || null,
    found: false,
  });
});

// ---------------------------------------------------------------------------
// GET /api/rules — Lists all known ZIP code pricing rules (for reference).
// ---------------------------------------------------------------------------
app.get("/api/rules", (_req, res) => {
  const rules = Object.entries(PRICING_RULES).map(([zip, data]) => ({
    zip,
    ...data,
  }));

  res.json({
    rules,
    defaultPrice: DEFAULT_PRICING,
    total: rules.length,
  });
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Root route — API documentation
// ---------------------------------------------------------------------------
app.get("/", (_req, res) => {
  res.json({
    name: "Shopify ZIP Code Pricing API",
    version: "1.0.0",
    description:
      "Returns location-based pricing for Shopify products based on ZIP code.",
    endpoints: {
      "GET /api/price": {
        description: "Get price for a ZIP code",
        params: {
          zip: "5-digit US ZIP code (required)",
          product_id: "Shopify product ID (optional)",
        },
        example: "/api/price?zip=75028&product_id=123",
      },
      "GET /api/rules": {
        description: "List all pricing rules",
      },
      "GET /health": {
        description: "Health check",
      },
    },
    testZipCodes: {
      "75028": "$1,499 — Texas (DFW Area)",
      "10001": "$1,699 — New York (Manhattan)",
      "90210": "$1,799 — Beverly Hills, CA",
      other: "$1,599 — Standard (default)",
    },
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🚀 ZIP Code Pricing API running on http://localhost:${PORT}`);
  console.log(`\n📋 Test endpoints:`);
  console.log(`   GET http://localhost:${PORT}/api/price?zip=75028`);
  console.log(`   GET http://localhost:${PORT}/api/price?zip=10001`);
  console.log(`   GET http://localhost:${PORT}/api/price?zip=90210`);
  console.log(`   GET http://localhost:${PORT}/api/price?zip=99999`);
  console.log(`   GET http://localhost:${PORT}/api/rules`);
  console.log(`   GET http://localhost:${PORT}/health\n`);
});
