require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ✅ CORS Configuration
const allowedOrigins = ["https://astrotalk.store"];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
}));

// ✅ API Rate Limiting (Prevents Spam Requests)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per 15 minutes
    message: "Too many requests, please try again later."
});
app.use(limiter);

// ✅ API Key Authentication for Security
const API_SECRET_KEY = process.env.API_SECRET_KEY;
app.use((req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== API_SECRET_KEY) {
        return res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }
    next();
});

// ✅ Shopify API Configuration
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || 'https://astrotalk.store';

// ✅ Fetch Order Details Securely from Shopify
app.get('/order/:orderId', async (req, res) => {
    const orderId = req.params.orderId;

    try {
        // Create a timeout controller
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

        // Fetch order from Shopify
        const response = await fetch(`${SHOPIFY_STORE_URL}/admin/api/2023-04/orders/${orderId}.json`, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeout); // Clear timeout once request completes

        // Handle Shopify API errors
        if (!response.ok) {
            return res.status(response.status).json({ error: `Shopify API error: ${response.statusText}` });
        }

        const data = await response.json();

        if (!data.order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json(data.order);
    } catch (error) {
        if (error.name === "AbortError") {
            return res.status(504).json({ error: "Request timed out. Try again later." });
        }
        res.status(500).json({ error: error.message });
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
