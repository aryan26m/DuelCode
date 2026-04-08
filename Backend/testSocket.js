const { io } = require("socket.io-client");

// simulate 2 users
const user1 = io("http://localhost:3000");
const user2 = io("http://localhost:3000");

let inviteCode = "";
let battleId = "";

// USER 1
user1.on("connect", () => {
  console.log("User1 connected");

  user1.emit("create_friend_lobby", {
    difficulty: "easy",
    userId: "69d227c30ecc2834c5035f29"
  });
});

user1.on("friend_lobby_created", (data) => {
  console.log("Lobby created:", data);
  inviteCode = data.inviteCode;
  battleId = data.battleId;

  // join with user2 after delay
  setTimeout(() => {
    user2.emit("join_friend_lobby", {
      inviteCode,
      userId: "69d4bc170235a55dfeebec34"
    });
  }, 2000);
});

// USER 2
user2.on("connect", () => {
  console.log("User2 connected");
});

// BOTH USERS LISTEN
user1.on("game_start", (data) => {
  console.log("User1 Game Start:", data);
});

user2.on("game_start", (data) => {
  console.log("User2 Game Start:", data);
});

user1.on("game_over", (data) => {
  console.log("User1 Result:", data);
});

user2.on("game_over", (data) => {
  console.log("User2 Result:", data);
});