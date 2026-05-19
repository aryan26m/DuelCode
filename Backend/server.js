const dotenv = require("dotenv");
dotenv.config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDb = require("./src/config/db");
const extractQuestion = require("./src/scripts/questionExtract");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const allowedOrigins = app.locals.allowedOrigins || [];
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

const startServer = async () => {
    try {
        await connectDb();
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};
const gameManager = require("./src/sockets/gameManager");
gameManager(io);
app.get("/", (req, res) => {
    res.send("Welcome to the Question Extraction API"); ``
})
startServer();
