const express = require('express');
const router = express.Router();
const { getUserBattles, getBattleById } = require('../controllers/battle.controller');
const authMiddleware=require("../middlewares/auth.middleware")

router.get('/history', authMiddleware.authMiddleware, getUserBattles);
router.get('/:id', authMiddleware.authMiddleware, getBattleById);

module.exports = router;