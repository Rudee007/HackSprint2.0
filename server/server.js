const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/database');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/error.middleware');
const { generalLimiter } = require('./src/middleware/rateLimit.middleware');

const http = require('http');
const WebSocketService = require('./src/services/websocket.service');

require('dotenv').config();

const app = express();
connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(generalLimiter);

app.use('/api', routes);

const server = http.createServer(app);

const wsService = new WebSocketService(server);

app.set('wsService', wsService);

// Central/last error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3003;

// ✅ FIXED: Listen on server, not app
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 WebSocket server ready for real-time connections`);
});

module.exports = { app, server, wsService }; // Export all three
