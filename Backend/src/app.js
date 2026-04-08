const express=require("express");
const cookieParser=require("cookie-parser");
const cors=require("cors");
const app=express();
const {sendEmail} =require("./services/email.service");

const allowedOrigins = (process.env.FRONTEND_URLS || [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://duel-code-brown.vercel.app"
].join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json());
app.use(cookieParser());

app.locals.allowedOrigins = allowedOrigins;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
//Routerss

const authRouter=require("./routes/auth.route");
const battleRouter = require('./routes/battle.route');

app.use("/api/auth",authRouter);
app.use('/api/battle', battleRouter);


//email testingg
// Example usage
// sendEmail(
//   'shivaverma7777@gmail.com',
//   'Testinng duelcode',
//   'This is a test email sent with Nodemailer using OAuth2.',
//   '<p>This is a test email sent with <b>Nodemailer</b> using OAuth2.</p>'
// );

module.exports=app;