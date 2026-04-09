const crypto = require("crypto");
const battleModel = require("../models/battle.model");
const questionsCfModel = require("../models/problemscf.model");
const userModel = require("../models/user.model");
const { getAcceptedSubmissions } = require("../utils/cfChecker");

const activeTimers = {};
let waitingQueue = { easy: [], medium: [], hard: [] };
const DISCONNECT_GRACE_MS = 12000;

const normalizeUserId = (userId) => userId?.toString?.() || null;

const hasAnotherSocketForUser = (io, userId, excludeSocketId) => {
    const normalized = normalizeUserId(userId);
    if (!normalized) return false;

    return Array.from(io.sockets.sockets.values()).some((s) => {
        if (s.id === excludeSocketId) return false;
        return normalizeUserId(s.userId) === normalized;
    });
};

// 🏆 AUTO-JUDGE AT THE TOP
const startAutoJudge = (battleId, roomCode, io) => {
    if (activeTimers[roomCode]) return;

    activeTimers[roomCode] = {
        intervalId: null,
        isRunning: false
    };

    activeTimers[roomCode].intervalId = setInterval(async () => {
        try {
            if (activeTimers[roomCode].isRunning) return;
            activeTimers[roomCode].isRunning = true;

            const battle = await battleModel.findById(battleId)
                .populate("problemId")
                .populate("player1")
                .populate("player2");

            if (!battle || battle.status === "completed") {
                clearInterval(activeTimers[roomCode].intervalId);
                delete activeTimers[roomCode];
                return;
            }
console.log("Auto-judging battle:", battleId);
            // 🔥 ADD TIMEOUT HERE 👇
const MAX_TIME = 30 * 60 * 1000 // 30 min

if (Date.now() - battle.startTime > MAX_TIME) {
    console.log("Battle timeout")

    io.to(roomCode).emit("game_over", {
        winnerId: null,
        message: "Time up! No winner."
    })

    clearInterval(activeTimers[roomCode].intervalId)
    delete activeTimers[roomCode]
    return
}


            const problem = battle.problemId;

            const [p1Time, p2Time] = await Promise.all([
                getAcceptedSubmissions(battle.player1.cfHandle, problem.cfContestId, problem.cfIndex, battle.startTime),
                getAcceptedSubmissions(battle.player2.cfHandle, problem.cfContestId, problem.cfIndex, battle.startTime)
            ]);

            let winner = null;

            if (p1Time && p2Time) {
                winner = p1Time <= p2Time ? battle.player1._id : battle.player2._id;
            } else if (p1Time) {
                winner = battle.player1._id;
            } else if (p2Time) {
                winner = battle.player2._id;
            }

            if (winner) {
                const updatedBattle = await battleModel.findOneAndUpdate(
                    { _id: battleId, status: { $ne: "completed" } },
                    { winner, status: "completed" },
                    { returnDocument: "after" }
                );

                if (updatedBattle) {
                    const loser = winner.toString() === battle.player1._id.toString() ? battle.player2._id : battle.player1._id;

                    // Update ratings
                    await Promise.all([
                        userModel.updateOne({ _id: winner }, { $inc: { rating: 25, winCount: 1 } }),
                        userModel.updateOne({ _id: loser }, { $inc: { rating: -25 } })
                    ]);

                    const timeTaken = Math.floor((Date.now() - new Date(battle.startTime).getTime()) / 1000);
                    io.to(roomCode).emit("game_over", {
                        winnerId: winner,
                        message: "The battle is over! We have a winner!",
                        timeTaken
                    });

                    console.log("Winner declared:", winner);
                    clearInterval(activeTimers[roomCode].intervalId);
                    delete activeTimers[roomCode];
                }
            }
        } catch (err) {
            console.error("Auto-check error:", err.message);
        } finally {
            if (activeTimers[roomCode]) {
                activeTimers[roomCode].isRunning = false;
            }
        }
    }, 7000);
};

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log(`🔌 Player Connected: ${socket.id}`);
        io.emit("online_users_count", io.engine.clientsCount);

        socket.on("get_online_users", () => {
            socket.emit("online_users_count", io.engine.clientsCount);
        });

        socket.on("register_user", ({ userId }) => {
            const normalized = normalizeUserId(userId);
            if (normalized) {
                socket.userId = normalized;
            }
        });

        socket.on("rejoin_battle", async ({ battleId, userId }) => {
            try {
                const normalized = normalizeUserId(userId);
                if (!battleId || !normalized) return;

                socket.userId = normalized;

                const activeBattle = await battleModel.findOne({
                    _id: battleId,
                    status: "active",
                    $or: [{ player1: normalized }, { player2: normalized }]
                });

                if (!activeBattle) {
                    socket.emit("error_message", "Battle is no longer active.");
                    return;
                }

                socket.join(activeBattle.inviteCode);
                socket.emit("battle_rejoined", {
                    battleId: activeBattle._id,
                    inviteCode: activeBattle.inviteCode
                });
            } catch (err) {
                console.error("Rejoin battle error", err);
            }
        });

        /**
         * FRIEND LOBBY LOGIC
         */
        socket.on("create_friend_lobby", async ({ difficulty, userId }) => {
            socket.userId = normalizeUserId(userId); // Track for disconnect
            try {
                const randomQuestion = await questionsCfModel.aggregate([
                    { $match: { difficulty } }, { $sample: { size: 1 } }
                ]);

                const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);

                const newBattle = await battleModel.create({
                    inviteCode,
                    player1: userId,
                    problemId: randomQuestion[0]._id,
                    status: 'waiting'
                });

                socket.join(inviteCode);
                socket.emit("friend_lobby_created", { inviteCode, battleId: newBattle._id });
            } catch (error) {
                console.error("Error creating friend lobby:", error.message);
                socket.emit("error_message", "Failed to create friend lobby.");
            }
        });

        socket.on("join_friend_lobby", async ({ userId, inviteCode }) => {
            socket.userId = normalizeUserId(userId); // Track for disconnect
            try {
                const battle = await battleModel.findOne({ inviteCode });
                if (!battle) return socket.emit("error_message", "Invalid invite code.");
                if (battle.status !== "waiting") return socket.emit("error_message", "Lobby no longer available.");

                battle.player2 = userId;
                battle.status = "active";
                battle.startTime = Date.now();
                await battle.save();

                await battle.populate(["problemId", "player1", "player2"]);

                socket.join(inviteCode);

                io.to(inviteCode).emit("game_start", {
                    message: "Your battle has started!",
                    battleId: battle._id,
                    problemId: battle.problemId,
                    player1: battle.player1,
                    player2: battle.player2
                });

                // 🚀 2. CALL AUTO-JUDGE HERE! Game has officially started.
                startAutoJudge(battle._id, inviteCode, io);

            } catch (error) {
                console.error("Error joining friend lobby:", error.message);
                socket.emit("error_message", "Failed to join friend lobby.");
            }
        });

        /**
         * RANDOM MATCHMAKING LOGIC
         */
        socket.on("find_random_match", async ({ userId, difficulty }) => {
            socket.userId = normalizeUserId(userId); // Track for disconnect
            try {
                if (waitingQueue[difficulty].length > 0) {
                    const opponent = waitingQueue[difficulty].pop();
                    if (opponent.userId === userId) {
                        waitingQueue[difficulty].push(opponent);
                        return socket.emit("error_message", "You are already in the queue.");
                    }

                    const randomQuestion = await questionsCfModel.aggregate([
                        { $match: { difficulty } }, { $sample: { size: 1 } }
                    ]);

                    const roomCode = `MATCH_${crypto.randomBytes(4).toString('hex')}`;
                    const newBattle = await battleModel.create({
                        inviteCode: roomCode,
                        player1: userId,
                        player2: opponent.userId,
                        problemId: randomQuestion[0]._id,
                        status: 'active',
                        startTime: Date.now()
                    });

                    await newBattle.populate(["problemId", "player1", "player2"]);

                    opponent.socket.join(roomCode);
                    socket.join(roomCode);

                    io.to(roomCode).emit("game_start", {
                        message: "Opponent Found! Lets Go!",
                        battleId: newBattle._id,
                        problemId: newBattle.problemId,
                        player1: newBattle.player1,
                        player2: newBattle.player2
                    });

                    // 🚀 3. CALL AUTO-JUDGE HERE! Game has officially started.
                    startAutoJudge(newBattle._id, roomCode, io);

                } else {
                    // Check if already in queue to prevent duplicates
                    const isAlreadyInQueue = waitingQueue[difficulty].some(p => p.userId === userId);
                    if (!isAlreadyInQueue) {
                        waitingQueue[difficulty].push({ userId, socket });
                    }
                    socket.emit("waiting_for_opponent", "Added to the queue. Waiting...");
                }
            } catch (err) {
                console.error(err);
            }
        });

        socket.on("cancel_random_match", ({ userId }) => {
            for (let diff in waitingQueue) {
                waitingQueue[diff] = waitingQueue[diff].filter(p => p.userId !== userId);
            }
        });

        socket.on("leave_battle", async ({ battleId, userId }) => {
            try {
                socket.userId = normalizeUserId(userId);

                const activeBattle = await battleModel.findOne({
                    _id: battleId,
                    $or: [{ player1: userId }, { player2: userId }],
                    status: 'active'
                });

                if (activeBattle) {
                    const winner = activeBattle.player1.toString() === userId ? activeBattle.player2 : activeBattle.player1;
                    const loser = activeBattle.player1.toString() === userId ? activeBattle.player1 : activeBattle.player2;
                    
                    activeBattle.status = 'completed';
                    activeBattle.winner = winner;
                    await activeBattle.save();

                    // Update ratings
                    await Promise.all([
                        userModel.updateOne({ _id: winner }, { $inc: { rating: 25, winCount: 1 } }),
                        userModel.updateOne({ _id: loser }, { $inc: { rating: -25 } })
                    ]);

                    const roomCode = activeBattle.inviteCode;
                    const timeTaken = Math.floor((Date.now() - new Date(activeBattle.startTime).getTime()) / 1000);
                    
                    io.to(roomCode).emit('game_over', {
                        winnerId: winner,
                        message: "Opponent fled the battle. You win by forfeit!",
                        timeTaken
                    });
                    
                    if (activeTimers[roomCode]) {
                        clearInterval(activeTimers[roomCode].intervalId);
                        delete activeTimers[roomCode];
                    }
                } else {
                    // If game already completed but someone left from results screen or left the room
                    const completedBattle = await battleModel.findById(battleId);
                    if (completedBattle) {
                        io.to(completedBattle.inviteCode).emit("opponent_left_results");
                    }
                }
            } catch (err) {
                console.error("Leave battle error", err);
            }
        });

        // Rematch Logic
        socket.on("request_rematch", async ({ battleId, userId }) => {
            try {
                const battle = await battleModel.findById(battleId);
                if (!battle) return;
                socket.to(battle.inviteCode).emit("rematch_requested", { userId });
            } catch(e) {
                console.error("Rematch request error", e);
            }
        });

        socket.on("accept_rematch", async ({ battleId, userId }) => {
            try {
                const battle = await battleModel.findById(battleId).populate("problemId");
                if (!battle) return;

                // Create new battle with same players & difficulty
                const difficulty = battle.problemId?.difficulty || "easy";
                const randomQuestion = await questionsCfModel.aggregate([
                    { $match: { difficulty } }, { $sample: { size: 1 } }
                ]);

                // Generate new invite code for DB uniqueness
                const isMatch = battle.inviteCode.startsWith("MATCH_");
                const newInviteCode = isMatch 
                    ? `MATCH_${crypto.randomBytes(4).toString('hex')}`
                    : crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);

                const newBattle = await battleModel.create({
                    inviteCode: newInviteCode, 
                    player1: battle.player1,
                    player2: battle.player2,
                    problemId: randomQuestion[0]._id,
                    status: 'active',
                    startTime: Date.now()
                });

                await newBattle.populate(["problemId", "player1", "player2"]);

                // Before emitting, make sure we use the old socket room to reach them, 
                // but they will join the new room automatically via frontend code in new battle if needed,
                // actually they just listen to game_start and navigate.
                // But the backend auto judge needs to listen to the new room or old room?
                // `startAutoJudge` takes the roomCode as the second parameter. We'll use newInviteCode.
                
                // Get all sockets in the old room and move them to the new room
                const socketsInOldRoom = await io.in(battle.inviteCode).fetchSockets();
                for (const s of socketsInOldRoom) {
                    s.leave(battle.inviteCode);
                    s.join(newInviteCode);
                }

                io.to(newInviteCode).emit("game_start", {
                    message: "Rematch accepted! Lets Go!",
                    battleId: newBattle._id,
                    problemId: newBattle.problemId,
                    player1: newBattle.player1,
                    player2: newBattle.player2
                });

                startAutoJudge(newBattle._id, newInviteCode, io);
            } catch(e) {
                console.error("Accept rematch error", e);
            }
        });

        socket.on('disconnect', async () => {
            console.log(`Player Disconnected: ${socket.id}`);
            
            // Broadcast updated count after a brief delay to ensure socket is fully removed
            setTimeout(() => {
                io.emit("online_users_count", io.engine.clientsCount);
            }, 100);

            for (let diff in waitingQueue) {
                waitingQueue[diff] = waitingQueue[diff].filter(p => p.socket.id !== socket.id);
            }
            
            // Check if player was in an active match
            const disconnectedUserId = normalizeUserId(socket.userId);
            if (!disconnectedUserId) return;

            setTimeout(async () => {
                try {
                    if (hasAnotherSocketForUser(io, disconnectedUserId, socket.id)) {
                        return;
                    }

                    const activeBattle = await battleModel.findOne({
                        $or: [{ player1: disconnectedUserId }, { player2: disconnectedUserId }],
                        status: 'active'
                    });

                    if (activeBattle) {
                        const winner = activeBattle.player1.toString() === disconnectedUserId ? activeBattle.player2 : activeBattle.player1;
                        const loser = activeBattle.player1.toString() === disconnectedUserId ? activeBattle.player1 : activeBattle.player2;

                        activeBattle.status = 'completed';
                        activeBattle.winner = winner;
                        await activeBattle.save();

                        // Update ratings
                        await Promise.all([
                            userModel.updateOne({ _id: winner }, { $inc: { rating: 25, winCount: 1 } }),
                            userModel.updateOne({ _id: loser }, { $inc: { rating: -25 } })
                        ]);

                        const roomCode = activeBattle.inviteCode;
                        const timeTaken = Math.floor((Date.now() - new Date(activeBattle.startTime).getTime()) / 1000);
                        
                        io.to(roomCode).emit('game_over', {
                            winnerId: winner,
                            message: "Opponent disconnected. You win by forfeit!",
                            timeTaken
                        });
                        
                        if (activeTimers[roomCode]) {
                            clearInterval(activeTimers[roomCode].intervalId);
                            delete activeTimers[roomCode];
                        }
                    } else {
                        // Check if they were just in results screen. We broadcast opponent left.
                        const lastBattle = await battleModel.findOne({
                            $or: [{ player1: disconnectedUserId }, { player2: disconnectedUserId }],
                            status: 'completed'
                        }).sort({ createdAt: -1 });

                        if (lastBattle) {
                            io.to(lastBattle.inviteCode).emit("opponent_left_results");
                        }
                    }
                } catch (err) {
                    console.error("Disconnect hook error", err);
                }
            }, DISCONNECT_GRACE_MS);
        });
    });
};