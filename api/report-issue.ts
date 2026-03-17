import express, { Request, Response } from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configure multer to store uploaded files in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, and JPEG files are allowed'));
    }
  }
});

// Guard: warn early if SMTP credentials are missing
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("⚠️  WARNING: EMAIL_USER or EMAIL_PASS is not set in .env — email sending will be disabled.");
}

// Create reusable transporter only when credentials are available
const transporter = EMAIL_USER && EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    })
  : null;

if (transporter) {
  transporter.verify((error: Error | null) => {
    if (error) {
      console.error("SMTP Authentication Error:", error);
    } else {
      console.log("✅ SMTP server ready to send emails");
    }
  });
}

router.post('/report-issue', upload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    const { name, email, category, priority, description, steps } = req.body;
    const screenshot = req.file;

    console.log("Report received:", req.body);
    console.log("Screenshot file:", req.file ? req.file.originalname : "No file");

    // Validate required fields
    if (!name || !email || !category || !description) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // If email is not configured, return a clean error
    if (!transporter) {
      console.warn("Email sending skipped: SMTP credentials not configured.");
      return res.status(503).json({ success: false, error: 'Email service is not configured. Please contact support.' });
    }

    // Format the email body
    const mailText = `
Reporter Name: ${name}
Reporter Email: ${email}
Bug Category: ${category}
Priority: ${priority}
Description:
${description}

Steps to Reproduce:
${steps || "N/A"}
    `.trim();

    // Prepare email message options
    const mailOptions: nodemailer.SendMailOptions = {
      from: EMAIL_USER,
      to: EMAIL_USER, // sent to the support inbox
      subject: `New Bug Report – Connectly`,
      text: mailText,
    };

    // Attach screenshot if it exists
    if (screenshot) {
      mailOptions.attachments = [
        {
          filename: screenshot.originalname,
          content: screenshot.buffer,
          contentType: screenshot.mimetype,
        },
      ];
    }

    console.log("Starting email sending to", EMAIL_USER);
    await transporter.sendMail(mailOptions);
    console.log("Email sending completed successfully.");

    res.status(200).json({ success: true, message: 'Bug report sent successfully' });
  } catch (error) {
    console.error("Email sending failed:", error);
    res.status(500).json({ success: false, error: 'Failed to send report' });
  }
});

export default router;
