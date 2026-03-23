import admin from "firebase-admin";
import { getSecret } from "./secretManager";

class FirebaseAdmin {
  private static instance: FirebaseAdmin;

  private constructor() {
    // Initialization happens in getInstance()
  }

  public static async getInstance(): Promise<FirebaseAdmin> {
    if (!FirebaseAdmin.instance) {
      const clientEmail = await getSecret("FIREBASE_CLIENT_EMAIL");
      const privateKey = (await getSecret("FIREBASE_PRIVATE_KEY")).replace(/\\n/g, '\n');
      const projectId = await getSecret("PROJECT_ID");

      admin.initializeApp({
        credential: admin.credential.cert({
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

  public getAuth() {
    return admin.auth();
  }
}

export default FirebaseAdmin;
export { admin }; // Exporting the original admin if needed for other services
