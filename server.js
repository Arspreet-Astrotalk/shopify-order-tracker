require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ✅ Restrict API Access to Only Your Shopify Store
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

// ✅ API Rate Limiting (Prevent Spam Requests)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per 15 minutes
    message: "Too many requests, please try again later."
});
app.use(limiter);

// ✅ Use API Key for Security
const API_SECRET_KEY = '49060b6500af28b1dbaaf932e10102ef';
app.use((req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== API_SECRET_KEY) {
        return res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }
    next();
});

// Shopify API Config
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || 'https://astrotalk.store';

// ✅ Fetch Order Details Securely
app.get('/order/:orderId', async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const response = await fetch(`${SHOPIFY_STORE_URL}/admin/api/2023-04/orders.json?name=${orderId}`, {
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

        if (data.orders.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json(data.orders[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
