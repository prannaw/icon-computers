const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    // These pull automatically from your .env file
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  },
});

// Verify the connection configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP Configuration Error:", error);
  } else {
    console.log("Mail Server is ready to send OTPs");
  }
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    // It is best to use your actual EMAIL_USER here to avoid spam filters
    from: `"ICON Computers" <${process.env.EMAIL_USER}>`,
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

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };