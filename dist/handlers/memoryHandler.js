"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMemory = handleMemory;
const uuid_1 = require("uuid");
async function handleMemory(context, parsedMessage, userData) {
    const { socket, userId, db, redisClient, updateSyncTimestamp, TTL } = context;
    if (parsedMessage.type === "createMemory") {
        const { characterId, memoryTitle, memoryContent, memorySplashArts } = parsedMessage;
        const newMemory = { uid: userId, memoryId: (0, uuid_1.v4)(), characterId, memoryTitle, memoryContent, memorySplashArts, lastModified: Date.now().toString() };
        await db.memories.create(newMemory);
        if (userData?.memories) {
            userData.memories.push(newMemory);
            await redisClient.setSession(userId, userData, TTL);
        }
        await updateSyncTimestamp(userId);
        socket.send(JSON.stringify({ type: "createMemoryResponse", status: "success", data: newMemory }));
    }
    else if (parsedMessage.type === "updateMemory") {
        const { memoryId, characterId, memoryTitle, memoryContent, memorySplashArts } = parsedMessage;
        await db.memories.update({ memoryId, characterId }, { $set: { memoryTitle, memoryContent, memorySplashArts } });
        if (userData?.memories) {
            const idx = userData.memories.findIndex((m) => m.memoryId === memoryId);
            if (idx !== -1) {
                userData.memories[idx] = { ...userData.memories[idx], memoryTitle, memoryContent, memorySplashArts };
                await redisClient.setSession(userId, userData, TTL);
            }
        }
        await updateSyncTimestamp(userId);
        socket.send(JSON.stringify({ type: "updateMemoryResponse", status: "success", memoryId }));
    }
    else if (parsedMessage.type === "deleteMemory") {
        const { memoryId, characterId } = parsedMessage;
        await db.memories.delete({ memoryId, characterId });
        if (userData?.memories) {
            userData.memories = userData.memories.filter((m) => m.memoryId !== memoryId);
            await redisClient.setSession(userId, userData, TTL);
        }
        await updateSyncTimestamp(userId);
        socket.send(JSON.stringify({ type: "deleteMemoryResponse", status: "success", memoryId }));
    }
}
