import { v4 as uuidv4 } from 'uuid';
import { Context } from "../types";
import { MessageDocument } from "../interface_types";

// In-memory set to prevent overlapping AI generations for the same conversation
const generatingConversations = new Set<string>();

export async function handleMessage(context: Context, parsedMessage: any) {
  const { socket, userId, db, redisClient, ai, updateSyncTimestamp, TTL } = context;

  if (parsedMessage.type === "getMessages") {
    const { conversationId, lastMessageTimestamp, limit = 20 } = parsedMessage;
    const filter: any = { conversationId };

    if (!lastMessageTimestamp) {
      const cachedMessages = await redisClient.getConversationCache(conversationId);
      if (cachedMessages) {
        socket.send(JSON.stringify({ type: "messagesResponse", conversationId, data: cachedMessages }));
        await redisClient.expireSession(`conv:${conversationId}`, TTL);
        return;
      }
    } else {
      filter.lastModified = { $lt: lastMessageTimestamp };
    }

    const messages = await db.messages.find(filter, { sort: { lastModified: -1 }, limit: limit });
    if (!lastMessageTimestamp) await redisClient.setConversationCache(conversationId, messages, TTL);
    socket.send(JSON.stringify({ type: "messagesResponse", conversationId, data: messages }));

  } else if (parsedMessage.type === "createConversation") {
    const { characterId, conversationTitle } = parsedMessage;
    const newConv = { uid: userId, conversationId: uuidv4(), characterId, conversationTitle, lastModified: Date.now().toString() };
    await db.conversations.create(newConv as any);
    await updateSyncTimestamp(userId);
    socket.send(JSON.stringify({ type: "createConversationResponse", status: "success", data: newConv }));

  } else if (parsedMessage.type === "chat") {
    const { conversationId, message: msgContent, messageId } = parsedMessage;

    // Prevention of overlapping requests for the same conversation
    if (generatingConversations.has(conversationId)) {
        console.log(`[Message Handler] Skipping overlapping AI request for conversation ${conversationId}`);
        return;
    }

    const conv = await db.conversations.findOne({ conversationId });
    if (!conv) throw new Error("Conversation not found");

    const userMsg: MessageDocument = { messageId, uid: userId, conversationId, messageTitle: "User", messageContent: msgContent, lastModified: Date.now().toString(), sender: "user" };
    await db.messages.create(userMsg as any);
    await redisClient.appendMessageToCache(conversationId, userMsg, TTL);

    try {
        generatingConversations.add(conversationId);
        const reply = await ai.generateReply(conv.characterId, conversationId);
        const timestamp = Date.now().toString();
        const aiMsg: MessageDocument = { messageId: uuidv4(), uid: userId, conversationId, messageTitle: "AI", messageContent: reply, lastModified: timestamp, sender: "ai" };
        await db.messages.create(aiMsg as any);
        await redisClient.appendMessageToCache(conversationId, aiMsg, TTL);
        await db.conversations.update({ conversationId }, { $set: { lastModified: timestamp } });

        await updateSyncTimestamp(userId);
        // CHANGED: response type to 'aiChatResponse' to prevent loops if client reflects 'chat'
        socket.send(JSON.stringify({ type: "aiChatResponse", message_id: aiMsg.messageId, reply, lastModified: timestamp }));
    } finally {
        generatingConversations.delete(conversationId);
    }
  }
}
