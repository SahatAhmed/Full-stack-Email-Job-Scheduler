// Request/Response types for API endpoints

export interface SendEmailRequest {
  senderEmail: string;
  subject: string;
  body: string;
  recipients: string[]; // Array of email addresses
  delayBetweenMs?: number; // delay between each email
  hourlyLimit?: number; // max emails per hour
}

export interface ScheduleEmailRequest extends SendEmailRequest {
  startTime: string; // ISO timestamp string
}

export interface ScheduleEmailResponse {
  success: boolean;
  batchId: string;
  totalEmails: number;
  scheduledEmails: Array<{
    id: string;
    recipientEmail: string;
    scheduledTime: number;
  }>;
  message: string;
}

export interface EmailJobStatus {
  id: string;
  recipientEmail: string;
  subject: string;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  scheduledTime: string;
  sentTime?: string;
  errorMessage?: string;
}

export interface EmailBatchStatus {
  id: string;
  subject: string;
  startTime: string;
  totalEmails: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  emailJobs: EmailJobStatus[];
}

export interface GetScheduledEmailsResponse {
  success: boolean;
  batches: Array<{
    id: string;
    subject: string;
    startTime: string;
    totalEmails: number;
    sentCount: number;
    failedCount: number;
    createdAt: string;
  }>;
}

export interface GetSentEmailsResponse {
  success: boolean;
  emails: Array<{
    id: string;
    batchId: string;
    recipientEmail: string;
    subject: string;
    sentTime: string;
    senderEmail: string;
  }>;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  googleId: string;
  avatar?: string;
}

export interface CreateSenderRequest {
  email: string;
  name?: string;
}

export interface CreateSenderResponse {
  success: boolean;
  senderId: string;
  email: string;
  name?: string;
}
