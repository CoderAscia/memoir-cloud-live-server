import { v4 as uuidv4 } from 'uuid';
import { Context } from "../types";
import { MemoryDocument } from "../interface_types";

export async function handleMemory(context: Context, parsedMessage: any, userData: any) {
  const { socket, userId, db, redisClient, updateSyncTimestamp, TTL } = context;

  if (parsedMessage.type === "createMemory") {
    const { characterId, memoryTitle, memoryContent, memorySplashArts } = parsedMessage;
    const newMemory: MemoryDocument = { uid: userId, memoryId: uuidv4(), characterId, memoryTitle, memoryContent, memorySplashArts, lastModified: Date.now().toString() };
    await db.memories.create(newMemory as any);
    if (userData?.memories) {
      userData.memories.push(newMemory);
      await redisClient.safeSetSession(userId, userData, TTL);
    }
    await updateSyncTimestamp(userId);
    socket.send(JSON.stringify({ type: "createMemoryResponse", status: "success", data: newMemory }));

  } else if (parsedMessage.type === "updateMemory") {
    const { memoryId, characterId, memoryTitle, memoryContent, memorySplashArts } = parsedMessage;
    await db.memories.update({ memoryId, characterId }, { $set: { memoryTitle, memoryContent, memorySplashArts } });
    if (userData?.memories) {
      const idx = userData.memories.findIndex((m: any) => m.memoryId === memoryId);
      if (idx !== -1) {
        userData.memories[idx] = { ...userData.memories[idx], memoryTitle, memoryContent, memorySplashArts };
        await redisClient.safeSetSession(userId, userData, TTL);
      }
    }
    await updateSyncTimestamp(userId);
    socket.send(JSON.stringify({ type: "updateMemoryResponse", status: "success", memoryId }));

  } else if (parsedMessage.type === "deleteMemory") {
    const { memoryId, characterId } = parsedMessage;
    await db.memories.delete({ memoryId, characterId });
    if (userData?.memories) {
      userData.memories = userData.memories.filter((m: any) => m.memoryId !== memoryId);
      await redisClient.safeSetSession(userId, userData, TTL);
    }
    await updateSyncTimestamp(userId);
    socket.send(JSON.stringify({ type: "deleteMemoryResponse", status: "success", memoryId }));
  }
}
