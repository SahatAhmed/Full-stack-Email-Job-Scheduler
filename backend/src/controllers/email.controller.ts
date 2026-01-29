import { Request, Response } from 'express';

export const sendEmail = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Normal fields
    const {
      senderEmail,
      subject,
      body,
      recipients,
      delayBetweenMs,
      hourlyLimit,
      startTime,
    } = req.body;

    // 2️⃣ Attachments
    const files = req.files as Express.Multer.File[];

    console.log('FILES:', files);
    /*
      files = [
        {
          fieldname: 'attachments',
          originalname: 'resume.pdf',
          mimetype: 'application/pdf',
          buffer: <Buffer>,
          size: 12345
        }
      ]
    */

    // Parse recipients
    const parsedRecipients = JSON.parse(recipients);

    // TODO: send email here (next step)

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      attachmentsCount: files?.length || 0,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
};