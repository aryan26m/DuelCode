const { sendEmail } = require("./email.service");

const sendWelcomeEmail = async (userEmail, username) => {
  try {
    const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/dashboard`;

    const subject = "Welcome to the Arena! Your 30-Day Challenge starts now.";
    const text = `Welcome, ${username}! Your DuelCode account is verified. Enter the arena and begin your 30-day streak challenge.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background-color: #09090b; color: #ffffff; border: 1px solid #27272a;">
        <h1 style="color: #ffffff; text-align: center; font-size: 28px; margin-bottom: 10px;">
          Duel<span style="color: #9333ea;">Code</span>
        </h1>

        <div style="background-color: #18181b; padding: 20px; border-radius: 8px; border-left: 4px solid #9333ea; margin-bottom: 25px;">
          <h2 style="margin-top: 0; color: #e4e4e7;">Welcome, ${username}!</h2>
          <p style="color: #a1a1aa; line-height: 1.6; font-size: 15px;">
            You have successfully verified your account. DuelCode is a real-time competitive programming arena. You can host private coding battles, challenge your friends, and have your Codeforces submissions judged automatically in real-time.
          </p>
        </div>

        <div style="background: linear-gradient(to right, #431407, #000000); padding: 20px; border-radius: 8px; border: 1px solid #c2410c; text-align: center;">
          <h2 style="color: #f97316; margin-top: 0;">The 30-Day Gauntlet</h2>
          <p style="color: #fdba74; line-height: 1.5; font-size: 15px; margin-bottom: 20px;">
            Are you ready to prove your consistency? Complete at least one coding battle every day for 30 consecutive days to unlock exclusive DuelCode loot and premium badges.
          </p>
          <p style="color: #ffffff; font-weight: bold; font-size: 16px;">
            Your streak starts today. Do not let the flame die.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${dashboardUrl}" style="background-color: #9333ea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            Enter the Arena
          </a>
        </div>

        <p style="text-align: center; color: #52525b; font-size: 12px; margin-top: 30px;">
          DuelCode Arena. All rights reserved.<br>
          If you need support, reply directly to this email.
        </p>
      </div>
    `;

    await sendEmail(userEmail, subject, text, html);
    console.log("Welcome email sent to:", userEmail);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

module.exports = { sendWelcomeEmail };
