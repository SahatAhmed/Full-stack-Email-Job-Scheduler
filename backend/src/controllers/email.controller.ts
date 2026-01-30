import { Request, Response } from 'express';

export const sendEmail = async (req: Request, res: Response) => {
  try {
    
    const {
      senderEmail,
      subject,
      body,
      recipients,
      delayBetweenMs,
      hourlyLimit,
      startTime,
    } = req.body;

    const files = req.files as Express.Multer.File[];

    console.log('FILES:', files);
    
    const parsedRecipients = JSON.parse(recipients);

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
