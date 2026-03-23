"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.admin = firebase_admin_1.default;
const secretManager_1 = require("./secretManager");
class FirebaseAdmin {
    constructor() {
        // Initialization happens in getInstance()
    }
    static async getInstance() {
        if (!FirebaseAdmin.instance) {
            const clientEmail = await (0, secretManager_1.getSecret)("FIREBASE_CLIENT_EMAIL");
            const privateKey = (await (0, secretManager_1.getSecret)("FIREBASE_PRIVATE_KEY")).replace(/\\n/g, '\n');
            const projectId = await (0, secretManager_1.getSecret)("PROJECT_ID");
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            FirebaseAdmin.instance = new FirebaseAdmin();
            console.log("Firebase Admin initialized");
        }
        return FirebaseAdmin.instance;
    }
    getAuth() {
        return firebase_admin_1.default.auth();
    }
}
exports.default = FirebaseAdmin;
