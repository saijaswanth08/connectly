import dotenv from "dotenv";
dotenv.config(); // Must run BEFORE any router modules are imported

import express from 'express';
import cors from 'cors';

// Dynamic import ensures dotenv has already loaded env vars
// before nodemailer reads process.env.EMAIL_USER / EMAIL_PASS
const { default: reportIssueRouter } = await import('./api/report-issue.js');
const { default: sendOtpRouter } = await import('./api/send-otp.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', reportIssueRouter);
app.use('/api', sendOtpRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
