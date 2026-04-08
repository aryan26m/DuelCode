const battleModel = require('../models/battle.model');

exports.getUserBattles = async (req, res) => {
    try {
        const userId = req.user.id; 
        
        const battles = await battleModel.find({
            $or: [{ player1: userId }, { player2: userId }],
            status: 'completed'
        })
        .populate('problemId', 'title difficulty link')
        .populate('winner', 'username') 
        .sort({ createdAt: -1 }) 
        .limit(10); 
        res.status(200).json(battles);
    } catch (error) {
        res.status(500).json({ message: "Error fetching battle history" });
    }
};

exports.getBattleById = async (req, res) => {
    try {
        const battle = await battleModel.findById(req.params.id)
            .populate('problemId')
            .populate('player1', 'username cfHandle rating winCount _id')
            .populate('player2', 'username cfHandle rating winCount _id');

        if (!battle) {
            return res.status(404).json({ message: "Battle not found" });
        }

        const userId = req.user?.id?.toString();
        const isParticipant =
            battle.player1?._id?.toString() === userId ||
            battle.player2?._id?.toString() === userId;

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not part of this battle" });
        }

        res.status(200).json(battle);
    } catch (error) {
        res.status(500).json({ message: "Error fetching battle info" });
    }
};