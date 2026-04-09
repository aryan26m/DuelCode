require('dotenv').config();
const dns = require('dns');
const nodemailer = require('nodemailer');

try {
  // Cloud environments may return IPv6 first for smtp.gmail.com; prefer IPv4.
  dns.setDefaultResultOrder('ipv4first');
} catch (error) {
  // Ignore when unsupported by the current Node runtime.
}

const hasOAuthConfig =
  Boolean(process.env.CLIENT_ID) &&
  Boolean(process.env.CLIENT_SECRET) &&
  Boolean(process.env.REFRESH_TOKEN);

const hasPasswordConfig = Boolean(process.env.EMAIL_PASS);
const EMAIL_AUTH_MODE = String(process.env.EMAIL_AUTH_MODE || 'auto').trim().toLowerCase();

const buildAuthConfig = () => {
  if (!process.env.EMAIL_USER) {
    const error = new Error('EMAIL_USER is missing');
    error.code = 'EMAIL_CONFIG_MISSING';
    throw error;
  }

  if (EMAIL_AUTH_MODE === 'password') {
    if (!hasPasswordConfig) {
      const error = new Error('EMAIL_AUTH_MODE=password but EMAIL_PASS is missing');
      error.code = 'EMAIL_CONFIG_MISSING';
      throw error;
    }

    return {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    };
  }

  if (EMAIL_AUTH_MODE === 'oauth2') {
    if (!hasOAuthConfig) {
      const error = new Error('EMAIL_AUTH_MODE=oauth2 but OAuth2 vars are missing');
      error.code = 'EMAIL_CONFIG_MISSING';
      throw error;
    }

    return {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    };
  }

  if (hasOAuthConfig) {
    return {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    };
  }

  if (hasPasswordConfig) {
    return {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    };
  }

  const error = new Error('Email auth config missing. Set OAuth2 vars or EMAIL_PASS');
  error.code = 'EMAIL_CONFIG_MISSING';
  throw error;
};

const parsePort = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeSmtpHost = (value) => {
  const host = String(value || '').trim();

  if (!host) {
    return 'smtp.gmail.com';
  }

  if (host.includes('@')) {
    console.warn('Invalid SMTP_HOST provided. Falling back to smtp.gmail.com');
    return 'smtp.gmail.com';
  }

  return host;
};

const SMTP_HOST = sanitizeSmtpHost(process.env.SMTP_HOST);
const SMTP_PORT = parsePort(process.env.SMTP_PORT, 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || (SMTP_PORT === 465 ? 'true' : 'false')).toLowerCase() === 'true';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  family: 4,
  requireTLS: !SMTP_SECURE,
  connectionTimeout: 20000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  tls: {
    servername: SMTP_HOST,
  },
  auth: buildAuthConfig(),
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  if (!to) {
    const error = new Error('Recipient email is required');
    error.code = 'EMAIL_RECIPIENT_MISSING';
    throw error;
  }

  const info = await transporter.sendMail({
    from: `"DuelCode" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });

  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  return info;
};

module.exports = {sendEmail};
