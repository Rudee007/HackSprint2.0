// server.js (PRODUCTION-READY)
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

const therapistRoutes = require('./src/routes/therapist.routes');
const prescriptionRoutes = require('./src/routes/prescription.routes');


// ✅ Connect Database
connectDB();

// ✅ Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(generalLimiter);

// ✅ API Routes
app.use('/api', routes);

// ✅ Error Handler
app.use(errorHandler);


// Add this in your main server file

// Mount routes
app.use('/api/therapists', therapistRoutes);

app.use('/api/prescriptions', prescriptionRoutes);

console.log('✅ Therapist routes mounted at /api/therapists');

// ✅ HTTP + WebSocket Server
const server = http.createServer(app);
const wsService = new WebSocketService(server);
app.set('wsService', wsService);

// // ✅ Graceful Shutdown Handlers
// const gracefulShutdown = (signal) => {
//   console.log(`\n⚠️  ${signal} received, shutting down gracefully...`);
  
//   // Stop accepting new connections
//   server.close(() => {
//     console.log('✅ HTTP server closed');
    
//     // Cleanup WebSocket service
//     wsService.cleanup();
    
//     // Close database connection
//     require('mongoose').connection.close(false, () => {
//       console.log('✅ MongoDB connection closed');
//       console.log('👋 Goodbye!');
//       process.exit(0);
//     });
//   });
  
//   // Force shutdown after 30 seconds
//   setTimeout(() => {
//     console.error('❌ Forced shutdown after timeout');
//     process.exit(1);
//   }, 30000);
// };
// ✅ Graceful Shutdown Handlers (Mongoose 7+ FIXED)
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received, shutting down gracefully...`);

  try {
    // Stop accepting new connections
    server.close(async () => {
      console.log('✅ HTTP server closed');

      // Cleanup WebSocket service
      wsService.cleanup();
      console.log('✅ WebSocket cleanup complete');

      // Close database connection (NO callback, Mongoose 7+)
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');

      console.log('👋 Goodbye!');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 30000);

  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
};


process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ✅ Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  gracefulShutdown('unhandledRejection');
});

// ✅ Start Server
const PORT =  3003;

server.listen(PORT, () => {
  console.log('');
  console.log('🚀 ═══════════════════════════════════════════');
  console.log(`🚀  Server running on http://localhost:${PORT}`);
  console.log('🔗  WebSocket ready for real-time tracking');
  console.log('💚  All systems operational');
  console.log('🚀 ═══════════════════════════════════════════');
  console.log('');
});

module.exports = { app, server, wsService };
