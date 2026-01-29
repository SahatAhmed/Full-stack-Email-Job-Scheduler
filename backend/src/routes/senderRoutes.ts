import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'crypto';
import { requireAuth } from '../middleware/authMiddleware';
import { CreateSenderRequest, CreateSenderResponse } from '../types/apiTypes';

const router = Router();
const prisma = new PrismaClient();

/**
 * Create a new sender
 * POST /api/senders
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const data: CreateSenderRequest = req.body;
    const userId = req.user!.id;

    if (!data.email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Check if sender already exists for this user
    const existing = await prisma.sender.findFirst({
      where: {
        userId,
        email: data.email,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Sender already exists for this email',
      });
    }

    const sender = await prisma.sender.create({
      data: {
        id: uuidv4(),
        email: data.email,
        name: data.name,
        userId,
      },
    });

    const response: CreateSenderResponse = {
      success: true,
      senderId: sender.id,
      email: sender.email,
      name: sender.name || undefined,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating sender:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sender',
    });
  }
});

/**
 * Get all senders for user
 * GET /api/senders
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const senders = await prisma.sender.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      senders: senders.map((sender) => ({
        id: sender.id,
        email: sender.email,
        name: sender.name,
        createdAt: sender.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching senders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch senders',
    });
  }
});

/**
 * Get single sender
 * GET /api/senders/:senderId
 */
router.get('/:senderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { senderId } = req.params;

    const sender = await prisma.sender.findFirst({
      where: {
        id: senderId,
        userId,
      },
    });

    if (!sender) {
      return res.status(404).json({
        success: false,
        error: 'Sender not found',
      });
    }

    res.json({
      success: true,
      sender: {
        id: sender.id,
        email: sender.email,
        name: sender.name,
        createdAt: sender.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching sender:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sender',
    });
  }
});

export default router;
