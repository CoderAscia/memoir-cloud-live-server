"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const secretManager_1 = require("./secretManager");
class Database {
    constructor(uri) {
        this.client = new mongodb_1.MongoClient(uri);
        this.dbName = uri.split('/').pop()?.split('?')[0] || 'memoir_db';
        console.log(`MongoDB: Resolved database name as '${this.dbName}'`);
    }
    static async getInstance() {
        if (!Database.instance) {
            const uri = await (0, secretManager_1.getSecret)('MONGODB_URI');
            Database.instance = new Database(uri);
            await Database.instance.connect();
        }
        return Database.instance;
    }
    async connect() {
        try {
            await this.client.connect();
            console.log('Connected successfully to MongoDB');
        }
        catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }
    getDb() {
        return this.client.db(this.dbName);
    }
    async close() {
        await this.client.close();
    }
}
exports.default = Database;
