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
const EMAIL_USE_GMAIL_API_FALLBACK = String(process.env.EMAIL_USE_GMAIL_API_FALLBACK || 'true').toLowerCase() === 'true';
const EMAIL_DELIVERY_STRATEGY = String(process.env.EMAIL_DELIVERY_STRATEGY || 'auto').trim().toLowerCase();
const IS_RENDER_RUNTIME = String(process.env.RENDER || '').toLowerCase() === 'true';

let gmailAccessTokenCache = null;
let gmailAccessTokenExpiryMs = 0;

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
const SMTP_CONNECTION_TIMEOUT_MS = parsePort(process.env.SMTP_CONNECTION_TIMEOUT_MS, 7000);
const SMTP_GREETING_TIMEOUT_MS = parsePort(process.env.SMTP_GREETING_TIMEOUT_MS, 7000);
const SMTP_SOCKET_TIMEOUT_MS = parsePort(process.env.SMTP_SOCKET_TIMEOUT_MS, 10000);

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

const canUseGmailApiFallback = () => {
  return EMAIL_USE_GMAIL_API_FALLBACK && hasOAuthConfig && Boolean(process.env.EMAIL_USER);
};

const resolveEmailDeliveryStrategy = () => {
  const allowedStrategies = ['auto', 'smtp-first', 'gmail-api-first'];
  const normalizedStrategy = allowedStrategies.includes(EMAIL_DELIVERY_STRATEGY)
    ? EMAIL_DELIVERY_STRATEGY
    : 'auto';

  if (normalizedStrategy === 'smtp-first' || normalizedStrategy === 'gmail-api-first') {
    return normalizedStrategy;
  }

  if (IS_RENDER_RUNTIME && canUseGmailApiFallback()) {
    return 'gmail-api-first';
  }

  return 'smtp-first';
};

const buildBase64Url = (value) => {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const buildRawGmailMessage = ({ from, to, subject, text, html }) => {
  const boundary = `duelcode-boundary-${Date.now()}`;
  const safeSubject = String(subject || '').replace(/[\r\n]+/g, ' ').trim();
  const plainTextBody = String(text || '').replace(/\r?\n/g, '\r\n');
  const htmlBody = String(html || text || '').replace(/\r?\n/g, '\r\n');

  const mimeBody = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${safeSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    plainTextBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');

  return buildBase64Url(mimeBody);
};

const getGmailAccessToken = async () => {
  const now = Date.now();

  if (gmailAccessTokenCache && now < gmailAccessTokenExpiryMs - 60 * 1000) {
    return gmailAccessTokenCache;
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      refresh_token: process.env.REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const tokenResponseText = await tokenResponse.text();
  if (!tokenResponse.ok) {
    const error = new Error(`Gmail token request failed (${tokenResponse.status}): ${tokenResponseText}`);
    error.code = 'GMAIL_TOKEN_REQUEST_FAILED';
    throw error;
  }

  let tokenPayload;
  try {
    tokenPayload = JSON.parse(tokenResponseText);
  } catch (parseError) {
    const error = new Error('Unable to parse Gmail token response');
    error.code = 'GMAIL_TOKEN_PARSE_FAILED';
    throw error;
  }

  if (!tokenPayload.access_token) {
    const error = new Error('Gmail token response missing access_token');
    error.code = 'GMAIL_TOKEN_MISSING';
    throw error;
  }

  const expiresInSec = Number(tokenPayload.expires_in || 3600);
  gmailAccessTokenCache = tokenPayload.access_token;
  gmailAccessTokenExpiryMs = now + expiresInSec * 1000;

  return gmailAccessTokenCache;
};

const sendWithGmailApi = async (message) => {
  if (!canUseGmailApiFallback()) {
    const error = new Error('Gmail API fallback is not configured');
    error.code = 'GMAIL_API_CONFIG_MISSING';
    throw error;
  }

  const accessToken = await getGmailAccessToken();
  const raw = buildRawGmailMessage(message);

  const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  const sendResponseText = await sendResponse.text();
  if (!sendResponse.ok) {
    const error = new Error(`Gmail API send failed (${sendResponse.status}): ${sendResponseText}`);
    error.code = 'GMAIL_API_SEND_FAILED';
    throw error;
  }

  let sendPayload = {};
  try {
    sendPayload = sendResponseText ? JSON.parse(sendResponseText) : {};
  } catch (parseError) {
    // Non-JSON body should not block successful send.
  }

  const messageId = sendPayload.id || 'unknown';
  console.log('Message sent via Gmail API: %s', messageId);

  return {
    messageId,
    provider: 'gmail-api',
  };
};

const tryGmailApiIfAvailable = async (message, reason) => {
  if (!canUseGmailApiFallback()) {
    return null;
  }

  try {
    console.warn('Trying Gmail API delivery (%s)', reason?.code || reason?.message || 'unknown reason');
    return await sendWithGmailApi(message);
  } catch (gmailApiError) {
    console.error('Gmail API delivery failed:', gmailApiError);
    return null;
  }
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

const sendWithSmtpChain = async (message) => {
  try {
    return await sendWithTransport(
      primaryTransporter,
      message,
      `primary ${SMTP_HOST}:${primarySmtpConfig.port}`
    );
  } catch (primaryError) {
    const primaryIsRetriable = isRetriableSmtpError(primaryError);

    // Fast path: in cloud environments, Gmail API over HTTPS is often faster than waiting on extra SMTP retries.
    if (primaryIsRetriable) {
      const gmailApiResult = await tryGmailApiIfAvailable(message, primaryError);
      if (gmailApiResult) {
        return gmailApiResult;
      }
    }

    if (!fallbackTransporter || !primaryIsRetriable) {
      const gmailApiResult = await tryGmailApiIfAvailable(message, primaryError);
      if (gmailApiResult) {
        return gmailApiResult;
      }

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

      const gmailApiResult = await tryGmailApiIfAvailable(message, fallbackError);
      if (gmailApiResult) {
        return gmailApiResult;
      }

      throw fallbackError;
    }
  }
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

  const strategy = resolveEmailDeliveryStrategy();
  if (strategy === 'gmail-api-first') {
    const strategySignal = new Error('gmail-api-first strategy');
    strategySignal.code = 'DELIVERY_STRATEGY_GMAIL_API_FIRST';

    const gmailApiResult = await tryGmailApiIfAvailable(message, strategySignal);
    if (gmailApiResult) {
      return gmailApiResult;
    }

    console.warn('Gmail API first strategy failed. Falling back to SMTP chain.');
  }

  return sendWithSmtpChain(message);
};

module.exports = {sendEmail};
