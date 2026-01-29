import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initRedis } from './lib/redis';
import { initEmailTransporter } from './lib/email';
import { initQueue } from './lib/queue';
import { authMiddleware } from './middleware/authMiddleware';
import emailRoutes from './routes/emailRoutes';
import senderRoutes from './routes/senderRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validation
if (!config.isValid()) {
  console.error('Invalid configuration. Please check your environment variables.');
  process.exit(1);
}

// Auth middleware
app.use(authMiddleware);

// Routes
app.use('/api/senders', senderRoutes);
app.use('/api/emails', emailRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Initialize services and start server
async function start() {
  try {
    console.log('Starting Email Scheduler Service...');

    // Initialize Redis
    console.log('[INIT] Initializing Redis connection...');
    await initRedis();

    // Initialize Email transporter
    console.log('[INIT] Initializing email transporter...');
    await initEmailTransporter();

    // Initialize BullMQ queue and worker
    console.log('[INIT] Initializing BullMQ queue and worker...');
    const { emailQueue, emailWorker } = await initQueue();

    // Start Express server
    const server = app.listen(config.port, () => {
      console.log(`[SERVER] Email Scheduler running on port ${config.port}`);
      console.log(`[SERVER] Environment: ${config.nodeEnv}`);
      console.log(`[SERVER] Frontend URL: ${config.frontendUrl}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[SHUTDOWN] SIGTERM received, shutting down gracefully...');
      server.close();
      
      if (emailWorker) {
        await emailWorker.close();
      }
      if (emailQueue) {
        await emailQueue.close();
      }
      
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('[SHUTDOWN] SIGINT received, shutting down gracefully...');
      server.close();
      
      if (emailWorker) {
        await emailWorker.close();
      }
      if (emailQueue) {
        await emailQueue.close();
      }
      
      process.exit(0);
    });
  } catch (error) {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
  }
}

start();
