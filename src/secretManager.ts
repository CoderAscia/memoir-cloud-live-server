import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

export async function getSecret(secretName: string): Promise<string> {

    const client = new SecretManagerServiceClient();
    const projectId = '1001059711478';

    const [version] = await client.accessSecretVersion({
        name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });

    if (!version.payload || !version.payload.data) {
        throw new Error("Secret payload is not defined");
    }

    return version.payload.data.toString();
}