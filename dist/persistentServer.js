"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const firebase_admin_js_1 = __importDefault(require("./firebase_admin.js"));
const uuid_1 = require("uuid");
const port = 3030;
const API_KEY = process.env.OPENAI_API_KEY ?? null;
const wss = new ws_1.WebSocketServer({ port: port, host: "0.0.0.0" });
if (API_KEY == null)
    throw new Error("API Key cannot be null");
wss.on("connection", async (socket, req) => {
    const url = req.url ?? "";
    const params = new URLSearchParams(url.replace("/?", ""));
    const token = params.get("token");
    let decodedToken;
    try {
        decodedToken = await firebase_admin_js_1.default.auth().verifyIdToken(token ?? "");
    }
    catch (err) {
        console.error("Invalid Firebase token:", err.message);
        socket.close();
        return;
    }
    const userId = decodedToken.uid;
    console.log("Authenticated user UID:", userId);
    socket.on("close", async () => {
        console.log("WebSocket connection closed");
    });
    try {
        socket.on("message", async (data) => {
            const message = data.toString();
            let parsedMessage;
            try {
                parsedMessage = JSON.parse(message);
            }
            catch (err) {
                console.error("Failed to parse message:", err);
                socket.send(JSON.stringify({ type: "error", message: "Invalid JSON format" }));
                return;
            }
            if (parsedMessage['type'] == "getLatestUserData") {
                const data = {
                    "type": "syncResponse",
                    "uid": userId,
                    "data": {
                        "timestampVersion": "prototype",
                        "characters": [
                            {
                                'characterId': "001",
                                'characterName': "John",
                                'characterImagePath': "assets/images/john.jpg",
                                'uid': userId,
                                'characterConversationIds': [],
                                'characterMemoriesIds': [],
                                'characterMetaData': {},
                            }
                        ]
                    },
                };
                socket.send(JSON.stringify(data));
                console.log("Sent latest user data");
            }
            if (parsedMessage.type == "chat") {
                socket.send(JSON.stringify({
                    'type': "chat",
                    "message_id": (0, uuid_1.v4)(),
                    "reply": `I received your message: ${parsedMessage.message}`,
                    "timestamp": Date.now().toString(),
                }));
                console.log("Sent chat response");
            }
        });
    }
    catch (err) {
        console.error("Invalid token:", err.message);
        socket.close();
    }
});
console.log(`WebSocket server running on ws://localhost:${port}`);
