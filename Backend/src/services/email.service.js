require('dotenv').config();
const nodemailer = require('nodemailer');

const hasOAuthConfig =
  Boolean(process.env.CLIENT_ID) &&
  Boolean(process.env.CLIENT_SECRET) &&
  Boolean(process.env.REFRESH_TOKEN);

const hasPasswordConfig = Boolean(process.env.EMAIL_PASS);

const buildAuthConfig = () => {
  if (!process.env.EMAIL_USER) {
    const error = new Error('EMAIL_USER is missing');
    error.code = 'EMAIL_CONFIG_MISSING';
    throw error;
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

const transporter = nodemailer.createTransport({
  service: 'gmail',
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
