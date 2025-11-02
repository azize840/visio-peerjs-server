require('dotenv').config();

const express = require('express');
const { PeerServer } = require('peer');
const cors = require('cors');

const app = express();

// ==================== CONFIGURATION CORS POUR RENDER ====================
const corsOptions = {
    origin: [
        'https://pandurate-squatly-hae.ngrok-free.dev',
        'https://visiocampus-socketio.onrender1.com',
        'https://visio-sfu-server-4.onrender.com',
        'http://localhost:3000',
        'http://localhost:8000',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json());

// ==================== ROUTES HEALTH CHECK ====================

// Health check principal
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        service: 'PeerJS P2P Server - VisioCampus',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check pour Render
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'PeerJS P2P Server - VisioCampus',
        timestamp: new Date().toISOString(),
        peers_connected: Object.keys(peerServer._clients || {}).length
    });
});

// Info réseau
app.get('/network-info', (req, res) => {
    const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 9000}`;

    res.json({
        server: 'PeerJS P2P - VisioCampus',
        server_url: serverUrl,
        secure: process.env.NODE_ENV === 'production',
        path: '/myapp',
        key: 'visiocampus-peerjs',
        timestamp: new Date().toISOString(),
        peers_connected: Object.keys(peerServer._clients || {}).length
    });
});

// ==================== DÉMARRAGE DU SERVEUR HTTP ====================
const PORT = process.env.PORT || 9000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    console.log('='.repeat(50));
    console.log('🚀 VISIOCAMPUS PEERJS P2P SERVER');
    console.log('='.repeat(50));
    console.log(`📡 Port: ${PORT}`);
    console.log(`🖥️  Host: ${HOST}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(50));
    console.log('✅ Routes disponibles:');
    console.log(`   🏠 Home: /`);
    console.log(`   ❤️  Health: /health`);
    console.log(`   🌐 Network: /network-info`);
    console.log('='.repeat(50));
    console.log(`✅ Serveur PeerJS prêt sur Render`);
    console.log('='.repeat(50));
});

// ==================== CONFIGURATION PEERJS SERVER ====================
const peerServer = PeerServer({
    server: server,
    path: '/myapp',
    proxied: true,
    debug: process.env.NODE_ENV !== 'production',
    allow_discovery: true,
    concurrent_limit: 100,
    key: 'visiocampus-peerjs',
    // SUPPRIMER 'port' et 'host' - PeerJS utilisera le serveur Express existant
    corsOptions: corsOptions,

    // Configuration pour la stabilité
    alive_timeout: 60000,
    expire_timeout: 5000,
    cleanup_timeout: 3000,
    generate_client_id: () => {
        return 'vc-' + (Math.random().toString(36) + '00000000000000000').slice(2, 16);
    }
});

// ==================== ÉVÉNEMENTS PEERJS ====================

peerServer.on('connection', (client) => {
    console.log(`✅ Peer connecté: ${client.getId()}`);
    console.log(`📊 Total peers connectés: ${Object.keys(peerServer._clients).length}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`❌ Peer déconnecté: ${client.getId()}`);
    console.log(`📊 Total peers connectés: ${Object.keys(peerServer._clients).length}`);
});

peerServer.on('message', (client, message) => {
    console.log(`📨 Message de ${client.getId()}:`, message.type || message);
});

peerServer.on('error', (error) => {
    console.error('❌ Erreur PeerJS:', error);
});

// ==================== GESTION PROPRE DE L'ARRÊT ====================
const gracefulShutdown = () => {
    console.log('\n🛑 Arrêt du serveur PeerJS...');

    // Fermer le serveur PeerJS
    peerServer.close(() => {
        console.log('✅ Serveur PeerJS fermé');
    });

    // Fermer le serveur HTTP
    server.close(() => {
        console.log('✅ Serveur HTTP fermé');
        process.exit(0);
    });

    // Force l'arrêt après 10 secondes
    setTimeout(() => {
        console.error('⚠️  Arrêt forcé après timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
    console.error('❌ Erreur non gérée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejetée:', reason);
});
