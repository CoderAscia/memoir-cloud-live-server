"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCharacter = handleCharacter;
const uuid_1 = require("uuid");
async function handleCharacter(context, parsedMessage, userData) {
    const { socket, userId, db, redisClient, updateSyncTimestamp, TTL } = context;
    if (parsedMessage.type === "getCharacterDetails") {
        const { characterId } = parsedMessage;
        const conversations = await db.conversations.find({ characterId }, { sort: { lastModified: -1 } });
        const memories = await db.memories.find({ characterId }, { sort: { lastModified: -1 } });
        socket.send(JSON.stringify({ type: "characterDetailsResponse", characterId, data: { conversations, memories } }));
    }
    else if (parsedMessage.type === "createCharacter") {
        const name = parsedMessage.characterName?.trim();
        if (!name) {
            socket.send(JSON.stringify({ type: "createCharacterResponse", status: "error", message: "Character name is required" }));
            return;
        }
        if (await db.characters.findOne({ uid: userId, characterName: name })) {
            socket.send(JSON.stringify({ type: "createCharacterResponse", status: "error", message: "Character exists" }));
            await updateSyncTimestamp(userId);
            return;
        }
        const newChar = {
            characterId: (0, uuid_1.v4)(),
            lastModified: Date.now().toString(),
            uid: userId,
            characterName: name,
            characterImagePath: parsedMessage.characterImagePath,
            characterMetaData: parsedMessage.characterMetaData
        };
        await db.characters.create(newChar);
        if (userData?.characters) {
            userData.characters.push(newChar);
            await redisClient.setSession(userId, userData, TTL);
        }
        await updateSyncTimestamp(userId);
        socket.send(JSON.stringify({ type: "createCharacterResponse", status: "success", data: newChar }));
    }
    else if (parsedMessage.type === "updateCharacter") {
        const { characterId, ...updateData } = parsedMessage;
        await db.characters.update({ characterId, uid: userId }, { $set: updateData });
        if (userData?.characters) {
            const idx = userData.characters.findIndex((c) => c.characterId === characterId);
            if (idx !== -1) {
                userData.characters[idx] = { ...userData.characters[idx], ...updateData };
                await redisClient.setSession(userId, userData, TTL);
            }
        }
        await updateSyncTimestamp(userId);
        socket.send(JSON.stringify({ type: "updateCharacterResponse", status: "success", characterId }));
    }
    else if (parsedMessage.type === "deleteCharacter") {
        const { characterId } = parsedMessage;
        await db.characters.delete({ characterId, uid: userId });
        if (userData?.characters) {
            userData.characters = userData.characters.filter((c) => c.characterId !== characterId);
            await redisClient.setSession(userId, userData, TTL);
        }
        await updateSyncTimestamp(userId);
        socket.send(JSON.stringify({ type: "deleteCharacterResponse", status: "success", characterId }));
    }
}
