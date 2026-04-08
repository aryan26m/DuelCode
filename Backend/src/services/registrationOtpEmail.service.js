const { sendEmail } = require("./email.service");

const buildRegisterOtpEmailHtml = ({ username, otp, expiryMinutes }) => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DuelCode Verification OTP</title>
  </head>
  <body style="margin:0;padding:0;background:#0b1020;font-family:Arial,Helvetica,sans-serif;color:#e6edf6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;background:#0b1020;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#121a2f;border:1px solid #273457;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 14px;background:linear-gradient(135deg,#2f5bff,#6f3bff);">
                <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;">DuelCode Account Verification</h1>
                <p style="margin:8px 0 0;font-size:13px;color:#e7dcff;">Code. Conquer. Claim.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px;font-size:15px;color:#d7e1f5;">Hi ${username},</p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#c5d1ea;">
                  Use the OTP below to complete your DuelCode registration. This code expires in <b>${expiryMinutes} minutes</b>.
                </p>
                <div style="text-align:center;margin:20px 0 18px;">
                  <span style="display:inline-block;padding:12px 22px;border-radius:12px;background:#0c1327;border:1px solid #314773;font-size:30px;letter-spacing:10px;font-weight:700;color:#ff7676;">
                    ${otp}
                  </span>
                </div>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#98a8c8;">
                  If you did not request this OTP, you can safely ignore this email.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#98a8c8;">
                  For security reasons, never share this code with anyone.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#0f172c;border-top:1px solid #273457;">
                <p style="margin:0;font-size:11px;color:#8798bb;">DuelCode Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const sendRegistrationOtpEmail = async ({ userEmail, username, otp, expiryMinutes = 10 }) => {
  const subject = "Your DuelCode verification OTP";
  const text = `Your DuelCode OTP is ${otp}. It expires in ${expiryMinutes} minutes.`;
  const html = buildRegisterOtpEmailHtml({ username, otp, expiryMinutes });

  await sendEmail(userEmail, subject, text, html);
  return true;
};

module.exports = {
  sendRegistrationOtpEmail,
};
