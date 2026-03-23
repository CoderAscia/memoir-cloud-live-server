import WebSocket from "ws";
import DBHandler from "./dbHandler";
import RedisCloudClient from "./redisCloudClient";
import AIService from "./aiService";
import { UserDocument, CharacterDocument, MemoryDocument, ConversationDocument, MessageDocument } from "./interface_types";

export interface DeltaData {
  deltaCharacters: CharacterDocument[];
  deltaConversations: ConversationDocument[];
  deltaMessages: MessageDocument[];
  deltaMemories: MemoryDocument[];
  deltaVersion: string;
}

export interface Context {
  socket: WebSocket;
  userId: string;
  redisClient: RedisCloudClient;
  db: {
    users: DBHandler<UserDocument>;
    characters: DBHandler<CharacterDocument>;
    conversations: DBHandler<ConversationDocument>;
    messages: DBHandler<MessageDocument>;
    memories: DBHandler<MemoryDocument>;
  };
  ai: typeof AIService;
  updateSyncTimestamp: (userId: string) => Promise<void>;
  TTL: number;
}
