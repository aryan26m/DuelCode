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
const EMAIL_VERIFY_ON_BOOT = String(process.env.EMAIL_VERIFY_ON_BOOT || 'false').toLowerCase() === 'true';

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
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
const SMTP_CONNECTION_TIMEOUT_MS = parsePort(process.env.SMTP_CONNECTION_TIMEOUT_MS, 20000);
const SMTP_GREETING_TIMEOUT_MS = parsePort(process.env.SMTP_GREETING_TIMEOUT_MS, 15000);
const SMTP_SOCKET_TIMEOUT_MS = parsePort(process.env.SMTP_SOCKET_TIMEOUT_MS, 20000);

const buildTransportOptions = ({ port, secure }) => {
  return {
    host: SMTP_HOST,
    port,
    secure,
    family: 4,
    requireTLS: !secure,
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
    tls: {
      servername: SMTP_HOST,
    },
    auth: buildAuthConfig(),
  };
};

const primarySmtpConfig = {
  port: SMTP_PORT,
  secure: SMTP_SECURE,
};

const fallbackSmtpConfig =
  SMTP_PORT === 587 && !SMTP_SECURE
    ? { port: 465, secure: true }
    : SMTP_PORT === 465 && SMTP_SECURE
      ? { port: 587, secure: false }
      : { port: 465, secure: true };

const fallbackIsSameAsPrimary =
  fallbackSmtpConfig.port === primarySmtpConfig.port &&
  fallbackSmtpConfig.secure === primarySmtpConfig.secure;

const primaryTransporter = nodemailer.createTransport(buildTransportOptions(primarySmtpConfig));
const fallbackTransporter = fallbackIsSameAsPrimary
  ? null
  : nodemailer.createTransport(buildTransportOptions(fallbackSmtpConfig));

const verifyTransport = (transporter, label) => {
  transporter.verify((error) => {
    if (error) {
      console.error(`Email server verification failed (${label}):`, error.message);
      return;
    }

    console.log(`Email server is ready (${label})`);
  });
};

if (EMAIL_VERIFY_ON_BOOT) {
  verifyTransport(primaryTransporter, `primary ${SMTP_HOST}:${primarySmtpConfig.port}`);

  if (fallbackTransporter) {
    verifyTransport(fallbackTransporter, `fallback ${SMTP_HOST}:${fallbackSmtpConfig.port}`);
  }
}

const isRetriableSmtpError = (error) => {
  const code = String(error?.code || '').toUpperCase();

  return [
    'ETIMEDOUT',
    'ESOCKET',
    'ECONNECTION',
    'ENETUNREACH',
    'EHOSTUNREACH',
    'EDNS',
    'EAI_AGAIN',
    'ECONNRESET',
  ].includes(code);
};

const sendWithTransport = async (transporter, message, label) => {
  const info = await transporter.sendMail(message);
  console.log('Message sent via %s: %s', label, info.messageId);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('Preview URL: %s', previewUrl);
  }

  return info;
};

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  if (!to) {
    const error = new Error('Recipient email is required');
    error.code = 'EMAIL_RECIPIENT_MISSING';
    throw error;
  }

  const message = {
    from: `"DuelCode" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    return await sendWithTransport(
      primaryTransporter,
      message,
      `primary ${SMTP_HOST}:${primarySmtpConfig.port}`
    );
  } catch (primaryError) {
    if (!fallbackTransporter || !isRetriableSmtpError(primaryError)) {
      throw primaryError;
    }

    console.warn(
      'Primary SMTP failed (%s). Retrying with fallback %s:%s',
      primaryError.code || primaryError.message,
      SMTP_HOST,
      fallbackSmtpConfig.port
    );

    try {
      return await sendWithTransport(
        fallbackTransporter,
        message,
        `fallback ${SMTP_HOST}:${fallbackSmtpConfig.port}`
      );
    } catch (fallbackError) {
      console.error(
        'Fallback SMTP failed after primary error (%s):',
        primaryError.code || primaryError.message,
        fallbackError
      );
      throw fallbackError;
    }
  }
};

module.exports = {sendEmail};
