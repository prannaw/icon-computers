const nodemailer = require('nodemailer');

let transporter = null;

const getMailConfig = () => {
  const smtpService = process.env.SMTP_SERVICE || '';
  const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const fromEmail = process.env.MAIL_FROM || smtpUser;

  if (!smtpUser || !smtpPass || !fromEmail) {
    throw new Error('SMTP is not configured for order status emails.');
  }

  return {
    smtpService,
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
  const transportConfig = {
    port: cfg.smtpPort,
    secure: cfg.smtpSecure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: cfg.smtpUser,
      pass: cfg.smtpPass
    }
  };

  if (cfg.smtpService) {
    transportConfig.service = cfg.smtpService;
  } else {
    transportConfig.host = cfg.smtpHost;
  }

  transporter = nodemailer.createTransport(transportConfig);
  return transporter;
};

const stageMeta = {
  'Order Placed': { title: 'Order Placed', color: '#2563eb' },
  Packed: { title: 'Packed', color: '#0ea5e9' },
  Shipped: { title: 'Shipped', color: '#7c3aed' },
  Delivered: { title: 'Delivered', color: '#16a34a' }
};

const sendOrderStatusEmail = async ({
  toEmail,
  customerName,
  orderId,
  trackingStage
}) => {
  if (!toEmail) return;

  const cfg = getMailConfig();
  const meta = stageMeta[trackingStage] || { title: trackingStage, color: '#2563eb' };
  const safeName = customerName || 'Customer';
  const safeOrderId = orderId || 'N/A';

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:620px;margin:0 auto;padding:20px;border:1px solid #dbe4ef;border-radius:14px;background:#ffffff;">
      <h2 style="margin:0 0 8px;color:#0f172a;">ICON Computers</h2>
      <p style="margin:0 0 18px;color:#64748b;">Order Tracking Update</p>
      <p style="color:#1e293b;font-size:15px;">Hi ${safeName},</p>
      <p style="color:#334155;font-size:15px;line-height:1.5;">
        Your order <strong>${safeOrderId}</strong> is now in the following stage:
      </p>
      <div style="margin:18px 0;padding:14px 16px;border-radius:10px;border:1px solid #dbe4ef;background:#f8fbff;">
        <span style="display:inline-block;padding:8px 12px;border-radius:999px;background:${meta.color};color:#ffffff;font-weight:700;">
          ${meta.title}
        </span>
      </div>
      <p style="color:#475569;font-size:14px;line-height:1.5;">
        You can track your order by logging into your account and visiting <strong>My Orders</strong>.
      </p>
      <p style="margin-top:24px;color:#94a3b8;font-size:12px;">
        This is an automated notification from ICON Computers.
      </p>
    </div>
  `;

  const transport = getTransporter();
  await Promise.race([
    transport.sendMail({
      from: `"ICON Computers" <${cfg.fromEmail}>`,
      to: toEmail,
      subject: `Order ${safeOrderId}: ${meta.title}`,
      html
    }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Order status email timeout.')), 20000);
    })
  ]);
};

module.exports = { sendOrderStatusEmail };

