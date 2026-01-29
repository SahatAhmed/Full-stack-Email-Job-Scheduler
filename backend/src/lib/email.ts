import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;

export async function initEmailTransporter() {
  // For development/testing with Ethereal Email
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password,
    },
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('Email transporter verified and ready to send');
  } catch (error) {
    console.error('Email transporter error:', error);
    throw error;
  }

  return transporter;
}

export function getEmailTransporter() {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }
  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const transporter = getEmailTransporter();

  const result = await transporter.sendMail({
    from: options.from || config.smtp.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  return result;
}
