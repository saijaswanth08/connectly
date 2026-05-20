import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ── In-memory verification token store ──────────────────────────────────────
// Map<email, { token: string, expiry: number, attempts: number, lastAttempt: number }>
const verificationTokenStore = new Map<string, { token: string; expiry: number; attempts: number; lastAttempt: number }>();

const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutes
const RATE_LIMIT_MS = 60 * 1000; // 1 minute between resend attempts
const MAX_ATTEMPTS_PER_HOUR = 5;

function generateToken(): string {
  return uuidv4();
}

// Create Nodemailer transporter (same pattern as send-otp.ts)
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter =
  EMAIL_USER && EMAIL_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      })
    : null;

if (transporter) {
  transporter.verify((err) => {
    if (err) console.error('[send-verification-email] SMTP error:', err.message);
    else console.log('[send-verification-email] ✅ SMTP ready');
  });
} else {
  console.warn('[send-verification-email] ⚠️  EMAIL_USER / EMAIL_PASS not set — verification emails disabled.');
}

// ── POST /api/send-verification-email ────────────────────────────────────────
router.post('/send-verification-email', async (req: Request, res: Response) => {
  const { email, fullName } = req.body as { email?: string; fullName?: string };

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  if (!transporter) {
    return res.status(503).json({ success: false, error: 'Email service not configured.' });
  }

  const emailLower = email.toLowerCase();
  const existingRecord = verificationTokenStore.get(emailLower);

  // Rate limiting: Check if user is trying to resend too quickly
  if (existingRecord) {
    const timeSinceLastAttempt = Date.now() - existingRecord.lastAttempt;
    if (timeSinceLastAttempt < RATE_LIMIT_MS) {
      return res.status(429).json({ 
        success: false, 
        error: `Please wait ${Math.ceil((RATE_LIMIT_MS - timeSinceLastAttempt) / 1000)} seconds before requesting another verification email.` 
      });
    }

    // Check hourly rate limit
    if (existingRecord.attempts >= MAX_ATTEMPTS_PER_HOUR) {
      return res.status(429).json({ 
        success: false, 
        error: 'Too many verification email requests. Please try again later.' 
      });
    }
  }

  const token = generateToken();
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  verificationTokenStore.set(emailLower, { 
    token, 
    expiry: Date.now() + TOKEN_TTL_MS,
    attempts: (existingRecord?.attempts ?? 0) + 1,
    lastAttempt: Date.now(),
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: 'Verify Your Connectly Account',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1e1b4b;">Connect<span style="color: #4f46e5;">ly</span></h1>
        </div>
        
        <h2 style="margin-top: 0; color: #1e1b4b; font-size: 18px;">Welcome${fullName ? `, ${fullName}` : ''}!</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 16px 0;">
          Thank you for creating your Connectly account. To get started and unlock all features, please verify your email address.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 32px; border-radius: 24px; text-decoration: none; font-weight: 600; font-size: 16px; transition: background 0.2s;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 24px 0;">
          Or copy and paste this link in your browser:
        </p>
        <p style="color: #4f46e5; font-size: 12px; word-break: break-all; text-align: center; margin: 12px 0;">
          ${verificationLink}
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        
        <p style="color: #6b7280; font-size: 13px; margin: 12px 0;">
          This verification link expires in <strong>2 minutes</strong>. If you did not create this account, you can safely ignore this email.
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; margin: 16px 0; text-align: center;">
          <strong>Connectly</strong> • Organize Your Professional Network
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[send-verification-email] Verification email sent to ${email}`);
    res.status(200).json({ 
      success: true, 
      message: 'Verification email sent. Please check your inbox.' 
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send-verification-email] Email send failed:', errorMsg);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send verification email. Please try again later.' 
    });
  }
});

// ── POST /api/verify-email ───────────────────────────────────────────────────
router.post('/verify-email', (req: Request, res: Response) => {
  const { email, token } = req.body as { email?: string; token?: string };

  if (!email || !token) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and verification token are required.' 
    });
  }

  const emailLower = email.toLowerCase();
  const record = verificationTokenStore.get(emailLower);

  if (!record) {
    return res.status(400).json({ 
      success: false, 
      error: 'No verification token found. Please request a new verification email.' 
    });
  }

  if (Date.now() > record.expiry) {
    verificationTokenStore.delete(emailLower);
    return res.status(400).json({ 
      success: false, 
      error: 'Verification token has expired. Please request a new verification email.' 
    });
  }

  if (record.token !== token.trim()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid verification token.' 
    });
  }

  // Valid — clear the token so it can't be reused
  verificationTokenStore.delete(emailLower);
  console.log(`[send-verification-email] Email verified: ${email}`);
  
  res.status(200).json({ 
    success: true, 
    message: 'Email verified successfully.' 
  });
});

export default router;
