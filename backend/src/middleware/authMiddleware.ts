import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
      };
    }
  }
}

/**
 * Mock authentication middleware for development
 * In production, this would verify JWT tokens or OAuth sessions
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for user ID in headers (for development/testing)
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please set X-User-ID and X-User-Email headers.',
      });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: req.headers['x-user-name'] as string,
          googleId: userId,
          avatar: req.headers['x-user-avatar'] as string,
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }
  next();
}
