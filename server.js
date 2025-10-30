const express = require('express');
const { PeerServer } = require('peer');
const cors = require('cors');

const app = express();

// CORS pour Render
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://votre-app-frontend.onrender.com',
            'http://localhost:3000',
            'http://localhost:8000'
        ];

        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Health check pour Render
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'PeerJS P2P Server - VisioCampus',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 9000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 PeerJS Server running on port', PORT);
});

// Configuration PeerServer
const peerServer = PeerServer({
    server: server,
    path: '/myapp',
    proxied: true,
    debug: process.env.NODE_ENV !== 'production',
    allow_discovery: true,
    concurrent_limit: 100,
    key: 'visiocampus-peerjs',
    generate_client_id: () => {
        return 'vc-' + (Math.random().toString(36) + '00000000000000000').slice(2, 16);
    }
});

peerServer.on('connection', (client) => {
    console.log(`🔗 Client connecté: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`🔌 Client déconnecté: ${client.getId()}`);
});
