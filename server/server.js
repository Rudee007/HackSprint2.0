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

// ✅ Connect Database
connectDB();

// ✅ Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true })); // allow frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(generalLimiter);

// ✅ API Routes
app.use('/api', routes);

// ✅ Error Handler (last)
app.use(errorHandler);

// ✅ HTTP + WebSocket Server
const server = http.createServer(app);
const wsService = new WebSocketService(server);
app.set('wsService', wsService);



wsService.emitTherapyTrackingUpdate = function(eventType, data) {
  console.log('📡 Broadcasting therapy tracking update:', eventType);
  this.io.to('therapy_tracking').emit('therapy_tracking_update', {
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });
};

// ✅ Configurable Port (default: 3003)
const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 WebSocket server ready for real-time connections`);
});

module.exports = { app, server, wsService };
