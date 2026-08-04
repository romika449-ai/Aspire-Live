/**
 * ================================================================
 *  🚀 MY HLS PROXY SERVER - Livepush Style
 *  - Reverse Proxy to bypass CORS
 *  - Supports M3U8 playlists and TS segments
 *  - Adds required headers
 * ================================================================
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// ============================================================
// 📦 MIDDLEWARE
// ============================================================
app.use(cors()); // Allow all origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// 📊 LOGGING
// ============================================================
const log = (msg, data = '') => {
    console.log(`[${new Date().toISOString()}] ${msg}`, data);
};

// ============================================================
// ✅ HEALTH CHECK ENDPOINT
// ============================================================
app.get('/', (req, res) => {
    res.json({
        status: '✅ Proxy Server is Running!',
        version: '1.0.0',
        endpoints: {
            proxy: '/proxy?url=YOUR_M3U8_URL',
            health: '/health'
        }
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================================
// 🌐 MAIN PROXY ENDPOINT - Livepush style
// ============================================================
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    // Validate URL
    if (!targetUrl) {
        return res.status(400).json({
            error: 'Missing "url" parameter',
            example: '/proxy?url=https://example.com/stream.m3u8'
        });
    }

    log('🌐 Proxying:', targetUrl);

    try {
        // ============================================================
        // 🔥 1. FETCH FROM TARGET URL (ClassPlus / any HLS server)
        // ============================================================
        const response = await axios({
            method: 'GET',
            url: targetUrl,
            responseType: 'stream', // Important for video streams
            timeout: 30000, // 30 seconds
            headers: {
                // 🔑 Livepush-style headers to mimic a browser
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': targetUrl.includes('classplus') ? 'https://classplusapp.com/' : 'https://livepush.io/',
                'Origin': targetUrl.includes('classplus') ? 'https://classplusapp.com' : 'https://livepush.io',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            },
            // ⭐ Allow redirects
            maxRedirects: 5,
            // ⭐ Support cookies if needed
            withCredentials: true,
        });

        // ============================================================
        // 📤 2. SEND RESPONSE BACK TO CLIENT
        // ============================================================

        // Forward relevant headers
        const forwardHeaders = [
            'content-type',
            'content-length',
            'cache-control',
            'expires',
            'etag',
            'last-modified'
        ];

        forwardHeaders.forEach(header => {
            if (response.headers[header]) {
                res.setHeader(header, response.headers[header]);
            }
        });

        // 🔑 CRITICAL: Add CORS headers for the frontend
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Origin');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

        // ✅ Stream the data
        response.data.pipe(res);

        // Log completion
        response.data.on('end', () => {
            log('✅ Proxy complete for:', targetUrl);
        });

        response.data.on('error', (err) => {
            log('❌ Stream error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Stream error: ' + err.message });
            }
        });

    } catch (error) {
        log('❌ Proxy Error:', error.message);

        // Detailed error response
        const statusCode = error.response ? error.response.status : 500;
        const errorMessage = error.response ? error.response.statusText : error.message;

        if (!res.headersSent) {
            res.status(statusCode).json({
                error: 'Failed to fetch URL',
                details: errorMessage,
                url: targetUrl,
                timestamp: new Date().toISOString()
            });
        }
    }
});

// ============================================================
// 🚀 START THE SERVER
// ============================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 HLS PROXY SERVER STARTED!');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 Proxy Endpoint: http://localhost:${PORT}/proxy?url=YOUR_M3U8_URL`);
    console.log(`✅ Health Check: http://localhost:${PORT}/health`);
    console.log('========================================');
});
