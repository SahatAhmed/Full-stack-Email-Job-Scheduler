import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisClient } from './redis';
import { config } from '../config';
import { sendEmailJob } from '../workers/sendEmailWorker';

export interface EmailJobData {
  jobId: string;
  batchId: string;
  senderId: string;
  senderEmail: string;
  senderName?: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledTime: number; // timestamp
}

let emailQueue: Queue<EmailJobData> | null = null;
let emailWorker: Worker<EmailJobData> | null = null;
let emailQueueEvents: QueueEvents | null = null;

export async function initQueue() {
  const connection = getRedisClient();

  // Create queue
  emailQueue = new Queue<EmailJobData>('emails', {
    connection: connection as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    },
  });

  // Create worker
  emailWorker = new Worker<EmailJobData>('emails', sendEmailJob, {
    connection: connection as any,
    concurrency: config.queue.workerConcurrency,
  });

  // Setup queue events
  emailQueueEvents = new QueueEvents('emails', { connection: connection as any });

  // Log events
  emailWorker.on('completed', (job) => {
    console.log(`[WORKER] Email job ${job.id} completed`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`[WORKER] Email job ${job?.id} failed:`, err.message);
  });

  emailWorker.on('error', (err) => {
    console.error('[WORKER] Worker error:', err);
  });

  console.log(`[QUEUE] Email queue initialized with concurrency: ${config.queue.workerConcurrency}`);

  return { emailQueue, emailWorker };
}

export function getEmailQueue() {
  if (!emailQueue) {
    throw new Error('Email queue not initialized');
  }
  return emailQueue;
}

export function getEmailWorker() {
  if (!emailWorker) {
    throw new Error('Email worker not initialized');
  }
  return emailWorker;
}

export function getEmailQueueEvents() {
  if (!emailQueueEvents) {
    throw new Error('Email queue events not initialized');
  }
  return emailQueueEvents;
}

export async function closeQueue() {
  if (emailWorker) {
    await emailWorker.close();
  }
  if (emailQueue) {
    await emailQueue.close();
  }
  if (emailQueueEvents) {
    await emailQueueEvents.close();
  }
}

/**
 * Schedule an email to be sent at a specific time
 */
export async function scheduleEmail(data: EmailJobData) {
  const queue = getEmailQueue();
  const delayMs = Math.max(0, data.scheduledTime - Date.now());

  console.log(`[SCHEDULE] Scheduling email to ${data.recipientEmail} in ${delayMs}ms`);

  const job = await queue.add('send', data, {
    delay: delayMs,
    jobId: data.jobId, // Use the jobId as the queue job ID for idempotency
  });

  return job;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  const queue = getEmailQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    progress: job.progress(),
    attemptsMade: job.attemptsMade,
    data: job.data,
    state: await job.getState(),
    isCompleted: job.isCompleted(),
    isFailed: job.isFailed(),
  };
}
