const express=require("express");

const router=express.Router();
const authController=require("../controllers/authController")
const authMiddleware=require("../middlewares/auth.middleware")
/**
 * @route POST /auth/register
 * @desc Request OTP for new user registration
 * @access Public
 */
router.post("/register",authController.register);

/**
 * @route POST /auth/register/verify-otp
 * @desc Verify registration OTP and create account
 * @access Public
 */
router.post("/register/verify-otp",authController.verifyRegisterOtp);

/**
 * @route POST /auth/login
 * @desc Login a user and return a JWT token
 * @access Public
 */
router.post("/login",authController.login);

/***
 * @route POST /auth/logout
 * @desc Logout a user by invalidating the JWT token
 * @access Private
 */
router.post("/logout",authController.logout);

/**
 * @route GET /auth/profile
 * @desc Get the authenticated user's profile
 * @access Private
 */

router.get("/profile",authMiddleware.authMiddleware,authController.getProfile);

/**
 * @route GET /auth/leaderboard
 * @desc Get the top players sorted by rating
 * @access Public
 */
router.get("/leaderboard",authController.getLeaderboard);

module.exports=router;