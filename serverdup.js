require('dotenv').config();
const express = require('express');
const cors = require('cors');  // Import CORS
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;

app.use(cors());  // Enable CORS

const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE_URL = 'https://astrotalk.store';

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
    console.log(`Server is running on http://localhost:${PORT}`);
});
