const userModel=require("../models/user.model");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const blackListModel = require("../models/blackList.model");
const registrationOtpModel = require("../models/registrationOtp.model");
const { sendRegistrationOtpEmail } = require("../services/registrationOtpEmail.service");
const { sendWelcomeEmail } = require("../services/welcomeEmail.service");

const DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_REWARD_INTERVAL = 7;
const STREAK_REWARD_POINTS = 10;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

const toUtcDay = (date = new Date()) => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const getStreakTier = (streak = 0) => {
    if (streak >= 30) return "Legend";
    if (streak >= 14) return "Elite";
    if (streak >= 7) return "Consistent";
    return "Rookie";
};

const applyDailyStreak = (user) => {
    const today = toUtcDay(new Date());
    const meta = {
        didUpdate: false,
        rewardAwarded: 0,
        nextMilestoneIn: STREAK_REWARD_INTERVAL
    };

    if (!user.lastStreakDate) {
        user.currentStreak = Math.max(1, user.currentStreak || 0);
        user.lastStreakDate = today;
        meta.didUpdate = true;
    } else {
        const lastDate = toUtcDay(new Date(user.lastStreakDate));
        const dayDiff = Math.floor((today - lastDate) / DAY_MS);

        if (dayDiff === 1) {
            user.currentStreak = (user.currentStreak || 0) + 1;
            user.lastStreakDate = today;
            meta.didUpdate = true;
        } else if (dayDiff > 1) {
            user.currentStreak = 1;
            user.lastStreakDate = today;
            meta.didUpdate = true;
        }
    }

    if ((user.currentStreak || 0) > (user.longestStreak || 0)) {
        user.longestStreak = user.currentStreak;
    }

    if (meta.didUpdate && user.currentStreak % STREAK_REWARD_INTERVAL === 0) {
        user.rating = (Number(user.rating) || 0) + STREAK_REWARD_POINTS;
        meta.rewardAwarded = STREAK_REWARD_POINTS;
    }

    const remainder = user.currentStreak % STREAK_REWARD_INTERVAL;
    meta.nextMilestoneIn = remainder === 0 ? STREAK_REWARD_INTERVAL : STREAK_REWARD_INTERVAL - remainder;

    return meta;
};

const getExistingUserConflictMessage = async ({ email, username, cfHandle }) => {
    const existingUser = await userModel.findOne({
        $or: [{ email }, { username }, { cfHandle }]
    });

    if (!existingUser) return null;
    if (existingUser.email === email) return "Email already exists";
    if (existingUser.username === username) return "Username already exists";
    if (existingUser.cfHandle === cfHandle) return "Codeforces handle already exists";
    return "User details already exist";
};

async function register(req,res){
    try{
        const {username,email,password,cfHandle}=req.body;
        if(!username || !email || !password || !cfHandle){
            return res.status(400).json({
                message:"Email, password, and Codeforces handle are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim();
        const normalizedCfHandle = cfHandle.trim();

        const conflictMessage = await getExistingUserConflictMessage({
            email: normalizedEmail,
            username: normalizedUsername,
            cfHandle: normalizedCfHandle,
        });

        if (conflictMessage) {
            return res.status(400).json({
                message: conflictMessage
            });
        }

        const hashPassword = await bcrypt.hash(password,10);
        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
        const otpHash = await bcrypt.hash(otp,10);
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await registrationOtpModel.findOneAndUpdate(
            { email: normalizedEmail },
            {
                username: normalizedUsername,
                email: normalizedEmail,
                passwordHash: hashPassword,
                cfHandle: normalizedCfHandle,
                otpHash,
                otpExpiresAt,
                attempts: 0,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        try {
            await sendRegistrationOtpEmail({
                userEmail: normalizedEmail,
                username: normalizedUsername,
                otp,
                expiryMinutes: OTP_EXPIRY_MINUTES,
            });
        } catch (emailError) {
            console.error("Failed to send registration OTP email:", emailError);

            return res.status(503).json({
                message: "OTP could not be sent right now. Please try again in a few minutes."
            });
        }

        return res.status(200).json({
            message: "OTP sent to your email. Verify OTP to complete registration.",
            email: normalizedEmail,
            expiresInMinutes: OTP_EXPIRY_MINUTES,
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            message:"Server error"
        });
    }
}

async function verifyRegisterOtp(req,res){
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedOtp = String(otp).trim();

        const pendingRegistration = await registrationOtpModel.findOne({ email: normalizedEmail });
        if (!pendingRegistration) {
            return res.status(400).json({
                message: "No OTP request found for this email. Please request OTP again."
            });
        }

        if (pendingRegistration.otpExpiresAt < new Date()) {
            await registrationOtpModel.deleteOne({ _id: pendingRegistration._id });
            return res.status(400).json({
                message: "OTP has expired. Please request a new OTP."
            });
        }

        const isOtpValid = await bcrypt.compare(normalizedOtp, pendingRegistration.otpHash);
        if (!isOtpValid) {
            pendingRegistration.attempts = (pendingRegistration.attempts || 0) + 1;
            if (pendingRegistration.attempts >= MAX_OTP_ATTEMPTS) {
                await registrationOtpModel.deleteOne({ _id: pendingRegistration._id });
                return res.status(400).json({
                    message: "Too many invalid attempts. Please request a new OTP."
                });
            }

            await pendingRegistration.save();
            return res.status(400).json({
                message: "Invalid OTP. Please try again."
            });
        }

        const conflictMessage = await getExistingUserConflictMessage({
            email: pendingRegistration.email,
            username: pendingRegistration.username,
            cfHandle: pendingRegistration.cfHandle,
        });

        if (conflictMessage) {
            await registrationOtpModel.deleteOne({ _id: pendingRegistration._id });
            return res.status(400).json({
                message: conflictMessage
            });
        }

        const user = await userModel.create({
            username: pendingRegistration.username,
            email: pendingRegistration.email,
            password: pendingRegistration.passwordHash,
            cfHandle: pendingRegistration.cfHandle,
            rating: 800,
            currentStreak: 1,
            longestStreak: 1,
            lastStreakDate: toUtcDay(new Date())
        });

        await registrationOtpModel.deleteOne({ _id: pendingRegistration._id });

        // Welcome email should not block successful account creation.
        await sendWelcomeEmail(user.email, user.username);

        const token=jwt.sign({
            id:user._id,
            email:user.email
        },process.env.JWT_SECRET,{
            expiresIn:"7d"
        });

        res.cookie("token",token);

        return res.status(201).json({
            message:"User registered successfully",
            user:{
                username:user.username,
                id:user._id,
                email:user.email,
                cfHandle:user.cfHandle,
                rating:user.rating,
                winCount:user.winCount,
                currentStreak:user.currentStreak,
                longestStreak:user.longestStreak,
                streakTier:getStreakTier(user.currentStreak)
            },
            token
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            message:"Server error"
        });
    }
}

async function login(req,res){
    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({
                message:"Email and password are required"
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const user=await userModel.findOne({email: normalizedEmail}).select("+password");
        if(!user){
            return res.status(400).json({
                message:"Invalid credentials"
            });
        }

        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({
                message:"Invalid credentials"
            });
        }

        const token=jwt.sign({
            id:user._id,
            email:user.email
        },process.env.JWT_SECRET,{
            expiresIn:"7d"
        });

        res.cookie("token",token);

        return res.status(200).json({
            message:"User logged in successfully",
            user:{
                id:user._id,
                email:user.email,
                cfHandle:user.cfHandle,
                rating:user.rating,
                currentStreak:user.currentStreak || 0,
                longestStreak:user.longestStreak || 0,
                streakTier:getStreakTier(user.currentStreak || 0)
            },
            token
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            message:"Server error"
        });
    }
}

async function logout(req,res){
    try{
        const token=req.cookies.token;
        if(!token){
            return res.status(400).json({
                message:"No token provided"
            });
        }
        res.clearCookie("token");
        await blackListModel.create({token});
        return res.status(200).json({
            message:"User logged out successfully"
        });
    }   
    catch(err){
        console.log(err);
        return res.status(500).json({
            message:"Server error"
        }); 
    }
}

async function getProfile(req,res){
    try{
        const user=await userModel.findById(req.user.id);
        if(!user){
            return res.status(404).json({
                message:"User not found"
            });
        }

        const streakMeta = applyDailyStreak(user);
        if (streakMeta.didUpdate) {
            await user.save();
        }

        return res.status(200).json({
            user:{
                username:user.username,
                id:user._id,        
                email:user.email,
                cfHandle:user.cfHandle,
                rating:user.rating,
                winCount:user.winCount,
                currentStreak:user.currentStreak || 0,
                longestStreak:user.longestStreak || 0,
                lastStreakDate:user.lastStreakDate,
                streakTier:getStreakTier(user.currentStreak || 0)
            },
            streakMeta
        });

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            message:"Server error"
        });
    }
}
async function getLeaderboard(req, res) {
    try {
        const topUsers = await userModel.find()
            .sort({ rating: -1, winCount: -1 })
            .select("username cfHandle rating winCount _id")
            .limit(100); // Display top 100 on leaderboard

        return res.status(200).json({
            leaderboard: topUsers
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error fetching leaderboard"
        });
    }
}

module.exports={
    register,
    verifyRegisterOtp,
    login,
    logout,
    getProfile,
    getLeaderboard
};
