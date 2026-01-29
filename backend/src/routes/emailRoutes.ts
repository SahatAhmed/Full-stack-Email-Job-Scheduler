import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'crypto';
import { scheduleEmail } from '../lib/queue';
import { getRateLimitStatus } from '../lib/rateLimit';
import { requireAuth } from '../middleware/authMiddleware';
import {
  ScheduleEmailRequest,
  ScheduleEmailResponse,
  GetScheduledEmailsResponse,
  GetSentEmailsResponse,
} from '../types/apiTypes';

const router = Router();
const prisma = new PrismaClient();

/**
 * Send emails immediately
 * POST /api/emails/send
 */
router.post('/send', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const userId = req.user!.id;

    // Validate input
    if (!data.senderEmail || !data.subject || !data.body || !data.recipients || data.recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: senderEmail, subject, body, recipients',
      });
    }

    // Create email batch for immediate sending
    const batch = await prisma.emailBatch.create({
      data: {
        userId,
        subject: data.subject,
        body: data.body,
        senderEmail: data.senderEmail,
        startTime: new Date(), // Immediate
        delayBetweenMs: data.delayBetweenMs || 2000,
        hourlyLimit: data.hourlyLimit || 200,
        totalEmails: data.recipients.length,
      },
    });

    // Create and queue individual email jobs for immediate sending
    const emailJobs = data.recipients.map((recipientEmail: string) => {
      const jobId = uuidv4();
      return {
        id: jobId,
        batchId: batch.id,
        senderEmail: data.senderEmail,
        recipientEmail,
        subject: data.subject,
        body: data.body,
        status: 'pending' as const,
        userId,
      };
    });

    // Save email jobs
    await prisma.emailJob.createMany({
      data: emailJobs,
    });

    // Queue jobs with minimal delay (send immediately)
    for (const job of emailJobs) {
      await scheduleEmail({
        jobId: job.id,
        batchId: job.batchId,
        senderId: '', // Not used for direct sends
        senderEmail: job.senderEmail,
        recipientEmail: job.recipientEmail,
        subject: job.subject,
        body: job.body,
        scheduledTime: Date.now() + 100, // Send in 100ms
      });
    }

    res.json({
      success: true,
      campaignId: batch.id,
      totalEmails: data.recipients.length,
      message: 'Emails are being sent',
    });
  } catch (error) {
    console.error('[BACKEND] Send email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send emails',
    });
  }
});

/**
 * Schedule emails to be sent
 * POST /api/emails/schedule
 */
router.post('/schedule', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const userId = req.user!.id;

    // Validate input
    if (!data.senderEmail || !data.subject || !data.body || !data.recipients || data.recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: senderEmail, subject, body, recipients',
      });
    }

    const scheduledTime = new Date(data.startTime).getTime();
    if (scheduledTime < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'startTime must be in the future',
      });
    }

    // Create email batch
    const batch = await prisma.emailBatch.create({
      data: {
        userId,
        subject: data.subject,
        body: data.body,
        senderEmail: data.senderEmail,
        startTime: new Date(scheduledTime),
        delayBetweenMs: data.delayBetweenMs || 2000,
        hourlyLimit: data.hourlyLimit || 200,
        totalEmails: data.recipients.length,
      },
    });

    // Create individual email jobs
    const scheduledEmails = [];
    let currentDelay = 0;

    const emailJobs = data.recipients.map((recipientEmail: string) => {
      const jobId = uuidv4();
      const jobScheduledTime = scheduledTime + currentDelay;
      currentDelay += (data.delayBetweenMs || 2000);

      return {
        id: jobId,
        batchId: batch.id,
        senderEmail: data.senderEmail,
        recipientEmail,
        subject: data.subject,
        body: data.body,
        status: 'pending' as const,
        userId,
      };
    });

    // Batch create email jobs
    await prisma.emailJob.createMany({
      data: emailJobs,
    });

    // Schedule all jobs in BullMQ
    for (let i = 0; i < emailJobs.length; i++) {
      const emailJob = emailJobs[i];
      const jobScheduledTime = scheduledTime + (i * (data.delayBetweenMs || 2000));
      await scheduleEmail({
        jobId: emailJob.id,
        batchId: batch.id,
        senderId: '', // Not used
        senderEmail: data.senderEmail,
        recipientEmail: emailJob.recipientEmail,
        subject: emailJob.subject,
        body: emailJob.body,
        scheduledTime: jobScheduledTime,
      });

      scheduledEmails.push({
        id: emailJob.id,
        recipientEmail: emailJob.recipientEmail,
        scheduledTime: emailJob.scheduledTime.getTime(),
      });
    }

    const response: ScheduleEmailResponse = {
      success: true,
      batchId: batch.id,
      totalEmails: data.recipients.length,
      scheduledEmails,
      message: `Successfully scheduled ${data.recipients.length} emails`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error scheduling emails:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule emails',
    });
  }
});

/**
 * Get scheduled emails for user
 * GET /api/emails/scheduled
 */
router.get('/scheduled', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const batches = await prisma.emailBatch.findMany({
      where: {
        userId,
        emailJobs: {
          some: {
            status: 'PENDING',
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    const response: GetScheduledEmailsResponse = {
      success: true,
      batches: batches.map((batch) => ({
        id: batch.id,
        subject: batch.subject,
        startTime: batch.startTime.toISOString(),
        totalEmails: batch.totalEmails,
        sentCount: batch.sentCount,
        failedCount: batch.failedCount,
        createdAt: batch.createdAt.toISOString(),
      })),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled emails',
    });
  }
});

/**
 * Get sent emails for user
 * GET /api/emails/sent
 */
router.get('/sent', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt((req.query.limit as string) || '100');
    const offset = parseInt((req.query.offset as string) || '0');

    const sentEmails = await prisma.emailJob.findMany({
      where: {
        batch: {
          userId,
        },
        status: 'SENT',
      },
      include: {
        sender: true,
      },
      orderBy: {
        sentTime: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const response: GetSentEmailsResponse = {
      success: true,
      emails: sentEmails.map((email) => ({
        id: email.id,
        batchId: email.batchId,
        recipientEmail: email.recipientEmail,
        subject: email.subject,
        sentTime: (email.sentTime || new Date()).toISOString(),
        senderEmail: email.sender.email,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sent emails',
    });
  }
});

/**
 * Get batch details with all jobs
 * GET /api/emails/batch/:batchId
 */
router.get('/batch/:batchId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { batchId } = req.params;

    const batch = await prisma.emailBatch.findUnique({
      where: { id: batchId },
      include: {
        emailJobs: {
          orderBy: {
            scheduledTime: 'asc',
          },
        },
      },
    });

    if (!batch || batch.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    res.json({
      success: true,
      batch: {
        ...batch,
        startTime: batch.startTime.toISOString(),
        createdAt: batch.createdAt.toISOString(),
        updatedAt: batch.updatedAt.toISOString(),
        emailJobs: batch.emailJobs.map((job) => ({
          ...job,
          scheduledTime: job.scheduledTime.toISOString(),
          sentTime: job.sentTime?.toISOString() || null,
          createdAt: job.createdAt.toISOString(),
          updatedAt: job.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batch',
    });
  }
});

/**
 * Get rate limit status
 * GET /api/emails/rate-limit-status
 */
router.get('/rate-limit-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const senderId = req.query.senderId as string;

    const status = await getRateLimitStatus(senderId);

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error fetching rate limit status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rate limit status',
    });
  }
});

export default router;
