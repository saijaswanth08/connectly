import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// ── In-memory OTP store ─────────────────────────────────────────────────────
// Map<email, { otp: string, expiry: number }>
const otpStore = new Map<string, { otp: string; expiry: number }>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Create Nodemailer transporter (same pattern as report-issue.ts)
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
    if (err) console.error('[send-otp] SMTP error:', err.message);
    else console.log('[send-otp] ✅ SMTP ready');
  });
} else {
  console.warn('[send-otp] ⚠️  EMAIL_USER / EMAIL_PASS not set — OTP emails disabled.');
}

// ── POST /api/send-otp ───────────────────────────────────────────────────────
router.post('/send-otp', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  if (!transporter) {
    return res.status(503).json({ success: false, error: 'Email service not configured.' });
  }

  const otp = generateOtp();
  otpStore.set(email.toLowerCase(), { otp, expiry: Date.now() + OTP_TTL_MS });

  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: 'Connectly — Your Password Verification Code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="margin-top: 0; color: #1e1b4b;">🔐 Password Change Verification</h2>
        <p style="color: #4b5563;">Someone (hopefully you) requested a password change on your Connectly account.</p>
        <p style="color: #4b5563;">Enter this 6-digit code in the app to confirm:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; background: #eef2ff; padding: 12px 24px; border-radius: 8px;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in <strong>10 minutes</strong>. If you did not request this, ignore this email — your password will not be changed.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Powered by <strong>Connectly</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[send-otp] OTP sent to ${email}`);
    res.status(200).json({ success: true, message: 'Verification code sent.' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send-otp] Email send failed:', errorMsg);
    res.status(500).json({ success: false, error: 'Failed to send verification email.' });
  }
});

// ── POST /api/verify-otp ─────────────────────────────────────────────────────
router.post('/verify-otp', (req: Request, res: Response) => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required.' });
  }

  const key = email.toLowerCase();
  const record = otpStore.get(key);

  if (!record) {
    return res.status(400).json({ success: false, error: 'No verification code found. Request a new one.' });
  }

  if (Date.now() > record.expiry) {
    otpStore.delete(key);
    return res.status(400).json({ success: false, error: 'Verification code has expired. Request a new one.' });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ success: false, error: 'Invalid verification code.' });
  }

  // Valid — clear the OTP so it can't be reused
  otpStore.delete(key);
  res.status(200).json({ success: true, message: 'OTP verified.' });
});

export default router;
