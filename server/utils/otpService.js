const nodemailer = require('nodemailer');

let transporter = null;
let verifyTriggered = false;

const getMailConfig = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

  // Backward compatible with older env keys.
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const fromEmail = process.env.MAIL_FROM || smtpUser;

  if (!smtpUser || !smtpPass) {
    throw new Error(
      'SMTP is not configured. Set SMTP_USER and SMTP_PASS in server/.env (or EMAIL_USER/EMAIL_PASS as legacy fallback).'
    );
  }

  return {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    fromEmail
  };
};

const getTransporter = () => {
  if (transporter) return transporter;

  const cfg = getMailConfig();
  transporter = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpSecure, // true for 465, false for 587/2525
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: cfg.smtpUser,
      pass: cfg.smtpPass
    }
  });

  if (!verifyTriggered) {
    verifyTriggered = true;
    transporter.verify((error) => {
      if (error) {
        console.error('SMTP Configuration Error:', error.message);
      } else {
        console.log('Mail server is ready to send OTPs');
      }
    });
  }

  return transporter;
};

const sendOTPEmail = async (email, otp) => {
  const cfg = getMailConfig();
  const mailOptions = {
    from: `"ICON Computers" <${cfg.fromEmail}>`,
    to: email,
    subject: 'Verify Your Account - ICON Computers',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff; margin: 0; font-size: 28px;">ICON Computers</h1>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">Security Verification</p>
        </div>

        <div style="padding: 20px; color: #333;">
          <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
          <p style="font-size: 16px; line-height: 1.5;">Thank you for joining <strong>ICON Computers</strong>. To complete your registration and activate your account, please enter the following 6-digit verification code:</p>
          
          <div style="background-color: #f8f9fa; padding: 25px; text-align: center; border-radius: 10px; margin: 30px 0; border: 1px solid #edf2f7;">
            <span style="font-size: 36px; font-weight: 800; color: #1a202c; letter-spacing: 8px; font-family: monospace;">${otp}</span>
          </div>

          <p style="font-size: 14px; color: #718096; text-align: center;">This code is valid for <strong>10 minutes</strong>. For security reasons, please do not share this code with anyone.</p>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="font-size: 12px; color: #a0aec0;">If you did not request this code, you can safely ignore this email.</p>
          <p style="font-size: 12px; color: #a0aec0; margin-top: 5px;">&copy; 2026 ICON Computers. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  const mailTransporter = getTransporter();
  return Promise.race([
    mailTransporter.sendMail(mailOptions),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('SMTP timeout. Please verify SMTP settings and try again.')), 20000);
    })
  ]);
};

module.exports = { sendOTPEmail };
