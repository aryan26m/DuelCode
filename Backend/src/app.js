const express=require("express");
const cookieParser=require("cookie-parser");
const cors=require("cors");
const app=express();
const {sendEmail} =require("./services/email.service");
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:8080",
    credentials:true
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