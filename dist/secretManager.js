"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecret = getSecret;
const secret_manager_1 = require("@google-cloud/secret-manager");
async function getSecret(secretName) {
    const client = new secret_manager_1.SecretManagerServiceClient();
    const projectId = '1001059711478';
    const [version] = await client.accessSecretVersion({
        name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    if (!version.payload || !version.payload.data) {
        throw new Error("Secret payload is not defined");
    }
    return version.payload.data.toString();
}
