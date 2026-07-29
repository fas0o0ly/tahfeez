// src/services/emailService.js
const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    logger.info(`Email sent to ${to} — subject: "${subject}"`);
  } catch (err) {
    const detail = err.response?.body?.errors?.[0]?.message || err.message;
    logger.error(`Failed to send email to ${to}: ${detail}`);
    throw err;
  }
};

const sendVerificationEmail = async (to, fullName, verificationUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f9f7f2; margin: 0; padding: 40px 0; }
        .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1a4731, #2d6a4f); padding: 40px 32px; text-align: center; }
        .header h1 { color: #d4af37; font-size: 28px; margin: 0; letter-spacing: 1px; }
        .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px 32px; }
        .body p { color: #374151; line-height: 1.7; font-size: 15px; }
        .btn { display: inline-block; background: #2d6a4f; color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 24px 0; }
        .footer { background: #f3f4f6; padding: 20px 32px; text-align: center; }
        .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</h1>
          <p>${process.env.APP_NAME}</p>
        </div>
        <div class="body">
          <p>As-salamu alaykum <strong>${fullName}</strong>,</p>
          <p>JazakAllahu khayran for joining our Tahfeez platform. Please verify your email address to activate your account and begin your Quran memorization journey.</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="btn">Verify Email Address</a>
          </div>
          <hr class="divider">
          <p style="font-size: 13px; color: #6b7280;">This link expires in 24 hours. If you did not create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Verify your email — ${process.env.APP_NAME}`,
    html,
  });
};

const sendPasswordResetEmail = async (to, fullName, resetUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f9f7f2; margin: 0; padding: 40px 0; }
        .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1a4731, #2d6a4f); padding: 40px 32px; text-align: center; }
        .header h1 { color: #d4af37; font-size: 28px; margin: 0; }
        .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px 32px; }
        .body p { color: #374151; line-height: 1.7; font-size: 15px; }
        .btn { display: inline-block; background: #b45309; color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 24px 0; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin: 16px 0; }
        .warning p { color: #92400e; font-size: 13px; margin: 0; }
        .footer { background: #f3f4f6; padding: 20px 32px; text-align: center; }
        .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
          <p>${process.env.APP_NAME}</p>
        </div>
        <div class="body">
          <p>As-salamu alaykum <strong>${fullName}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>
          <div class="warning">
            <p>⚠️ This link expires in 1 hour. If you did not request a password reset, please secure your account immediately.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Reset your password — ${process.env.APP_NAME}`,
    html,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };