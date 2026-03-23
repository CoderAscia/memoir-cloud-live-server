"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeMessage = routeMessage;
const syncHandler_1 = require("./syncHandler");
const characterHandler_1 = require("./characterHandler");
const messageHandler_1 = require("./messageHandler");
const memoryHandler_1 = require("./memoryHandler");
async function routeMessage(context, parsedMessage, userData) {
    const { type } = parsedMessage;
    if (type === "getLatestUserData") {
        await (0, syncHandler_1.handleSync)(context, parsedMessage);
    }
    else if (["getCharacterDetails", "createCharacter", "updateCharacter", "deleteCharacter"].includes(type)) {
        await (0, characterHandler_1.handleCharacter)(context, parsedMessage, userData);
    }
    else if (["getMessages", "createConversation", "chat"].includes(type)) {
        await (0, messageHandler_1.handleMessage)(context, parsedMessage);
    }
    else if (["createMemory", "updateMemory", "deleteMemory"].includes(type)) {
        await (0, memoryHandler_1.handleMemory)(context, parsedMessage, userData);
    }
    else {
        console.warn(`Unknown message type: ${type}`);
    }
}
