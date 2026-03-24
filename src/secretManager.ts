import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

export async function getSecret(secretName: string): Promise<string | undefined> {

    const isDeployedInCloudRun = process.env.NODE_ENV === 'production';

    if (isDeployedInCloudRun) {
        const client = new SecretManagerServiceClient();
        const projectId = process.env.PROJECT_ID;

        if (!projectId) {
            throw new Error("Project ID is not defined");
        }

        const [version] = await client.accessSecretVersion({
            name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
        });

        if (!version.payload || !version.payload.data) {
            throw new Error("Secret payload is not defined");
        }

        return version.payload.data.toString();
    } else {
        return;
    }
}