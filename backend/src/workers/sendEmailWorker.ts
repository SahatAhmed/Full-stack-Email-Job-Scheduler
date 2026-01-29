import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../lib/email';
import { EmailJobData } from '../lib/queue';
import { config } from '../config';
import { checkRateLimit, incrementEmailCount } from '../lib/rateLimit';

const prisma = new PrismaClient();

/**
 * Worker function that processes email jobs
 * This is called by BullMQ when a job is ready to be processed
 */
export async function sendEmailJob(job: Job<EmailJobData>) {
  const { jobId, batchId, senderId, senderEmail, senderName, recipientEmail, subject, body } = job.data;

  console.log(`[WORKER] Processing email job ${jobId} for ${recipientEmail}`);

  try {
    // Check rate limiting before sending
    const canSend = await checkRateLimit(senderId);
    if (!canSend) {
      console.log(`[WORKER] Rate limit exceeded for sender ${senderId}, rescheduling job`);
      // Reschedule the job to run in 1 minute
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // Add artificial delay between emails to simulate provider throttling
    await new Promise((resolve) => setTimeout(resolve, config.queue.delayBetweenEmailsMs));

    // Send the email
    const result = await sendEmail({
      to: recipientEmail,
      subject: subject,
      html: body,
      from: senderName ? `${senderName} <${senderEmail}>` : senderEmail,
    });

    console.log(`[WORKER] Email sent to ${recipientEmail}, messageId: ${result.messageId}`);

    // Update email job status to SENT
    await prisma.emailJob.update({
      where: { id: jobId },
      data: {
        status: 'SENT',
        sentTime: new Date(),
        bullMQJobId: job.id,
      },
    });

    // Increment email count for rate limiting
    await incrementEmailCount(senderId);

    // Update batch sent count
    await prisma.emailBatch.update({
      where: { id: batchId },
      data: {
        sentCount: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      messageId: result.messageId,
      recipientEmail,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[WORKER] Failed to send email to ${recipientEmail}:`, errorMessage);

    // Special handling for rate limit errors - reschedule
    if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
      // Let BullMQ retry with backoff
      throw error;
    }

    // Update email job status to FAILED
    await prisma.emailJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: errorMessage,
        bullMQJobId: job.id,
      },
    });

    // Update batch failed count
    await prisma.emailBatch.update({
      where: { id: batchId },
      data: {
        failedCount: {
          increment: 1,
        },
      },
    });

    throw error;
  }
}
