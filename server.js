require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ✅ Temporary CORS fix for debugging
app.use(cors());

// ✅ API Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later."
});
app.use(limiter);

// ✅ API Key Authentication (DEBUG)
const API_SECRET_KEY = process.env.API_SECRET_KEY;
app.use((req, res, next) => {
    console.log("Received API Key:", req.headers["x-api-key"]); // Debugging
    if (req.headers["x-api-key"] !== API_SECRET_KEY) {
        return res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }
    next();
});

// ✅ Shopify API Configuration
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || 'https://your-shopify-store.myshopify.com';

// ✅ Fetch Order Details
app.get('/order/:orderId', async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const response = await fetch(`${SHOPIFY_STORE_URL}/admin/api/2023-04/orders/${orderId}.json`, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Shopify API error: ${response.statusText}` });
        }

        const data = await response.json();
        if (!data.order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json(data.order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});