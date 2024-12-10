import crypto from 'crypto';
import nodemailer from 'nodemailer';

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Log to check if credentials are being loaded correctly
console.log('EMAIL_USER:', process.env.EMAIL_USER);  // Should show your Gmail address
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);  // Should show your app-specific password

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',        // Using Gmail service

  auth: {
    user: process.env.EMAIL_USER,  // Use the email from .env (should be the full email address)
    pass: process.env.EMAIL_PASS,  // App-specific password from Gmail (not the regular email password)
  },
  tls: {
    rejectUnauthorized: false,     // Allows unauthorized connections (for self-signed certs, etc.)
  },
});

// Generate a 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};


export { transporter, generateOTP };