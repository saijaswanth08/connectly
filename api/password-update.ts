import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// ── Supabase Client Initialization ──────────────────────────────────────────
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (!supabase) {
  console.error('[password-update] ❌ Supabase credentials missing from process.env');
}

// ── In-memory store for pending updates ────────────────────────────────────
// Map<token, { email: string, newPassword: string, expiresAt: number }>
const pendingUpdates = new Map<string, { email: string; newPassword: string; expiresAt: number }>();

const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Nodemailer setup
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter = EMAIL_USER && EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    })
  : null;

/**
 * Health check route
 */
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Password update API is alive.' });
});

/**
 * Step 1: Request Password Update
 * POST /api/password-update
 */
router.post('/', async (req: Request, res: Response) => {
  console.log('[password-update] Received request:', req.body?.email);

  const { email, currentPassword, newPassword } = req.body || {};

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Auth service not configured on server.' });
  }

  try {
    // 1. Verify current password via Supabase
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      console.warn('[password-update] Auth failed for:', email, signInError.message);
      return res.status(401).json({ success: false, error: 'Incorrect current password.' });
    }

    // 2. Generate secure token
    const token = uuidv4();
    const expiresAt = Date.now() + TOKEN_TTL_MS;

    // 3. Store pending update
    pendingUpdates.set(token, { email, newPassword, expiresAt });

    // 4. Send verification email
    if (!transporter) {
      console.warn('[password-update] ⚠️ Email service not configured. Returning token in response for development.');
      return res.status(200).json({ 
        success: true, 
        message: 'Verification link generated. (Check server logs)', 
        debug_token: token // Only for dev convenience if email fails
      });
    }

    const verificationLink = `http://localhost:5173/verify-password-update?token=${token}`;
    
    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: 'Connectly — Confirm Your Password Update',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="margin-top: 0; color: #1e1b4b;">🔒 Confirm Password Update</h2>
          <p style="color: #4b5563;">You requested to change your password on Connectly.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Password Update</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link expires in 10 mins.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('[password-update] ✅ Email sent to:', email);
    res.status(200).json({ success: true, message: 'Verification email sent.' });

  } catch (err: any) {
    console.error('[password-update] ❌ Request failed:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Step 2: Verify Token (Internal)
 * POST /api/password-update/verify
 */
router.post('/verify', (req: Request, res: Response) => {
  const { token } = req.body || {};

  if (!token) {
    return res.status(400).json({ success: false, error: 'Token is required.' });
  }

  const record = pendingUpdates.get(token);

  if (!record || Date.now() > record.expiresAt) {
    if (record) pendingUpdates.delete(token);
    return res.status(400).json({ success: false, error: 'Invalid or expired token.' });
  }

  // Success
  res.json({ 
    success: true, 
    data: { email: record.email, newPassword: record.newPassword } 
  });

  pendingUpdates.delete(token);
});

export default router;

