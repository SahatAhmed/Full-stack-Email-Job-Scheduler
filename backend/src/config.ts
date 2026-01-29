import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // SMTP / Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@emailscheduler.local',
  },

  // Rate Limiting
  rateLimit: {
    maxEmailsPerHourGlobal: parseInt(process.env.MAX_EMAILS_PER_HOUR_GLOBAL || '500'),
    maxEmailsPerHourPerSender: parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '200'),
  },

  // Queue Configuration
  queue: {
    workerConcurrency: parseInt(process.env.QUEUE_WORKER_CONCURRENCY || '5'),
    delayBetweenEmailsMs: parseInt(process.env.DELAY_BETWEEN_EMAILS_MS || '2000'),
  },

  // Validation
  isValid: () => {
    const requiredVars = ['DATABASE_URL', 'REDIS_URL', 'SMTP_USER', 'SMTP_PASSWORD'];
    const missing = requiredVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      console.error('Missing required environment variables:', missing);
      return false;
    }
    return true;
  },
};
