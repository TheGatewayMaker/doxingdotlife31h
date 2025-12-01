import admin from "firebase-admin";

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App;

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  // Validate all required config
  if (!projectId || !privateKey || !clientEmail) {
    console.error(
      "Firebase Admin SDK configuration missing - cannot initialize",
      {
        hasProjectId: !!projectId,
        hasPrivateKey: !!privateKey,
        hasClientEmail: !!clientEmail,
      },
    );
    return null;
  }

  // Handle escaped newlines: convert literal \n (backslash-n) to actual newlines
  // This is needed when the .env file contains \n instead of actual line breaks
  privateKey = privateKey.replace(/\\n/g, "\n");

  // Also handle the case where quotes might be present
  privateKey = privateKey.trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.slice(1, -1);
  }

  // Validate private key format
  if (
    !privateKey.includes("BEGIN PRIVATE KEY") ||
    !privateKey.includes("END PRIVATE KEY")
  ) {
    console.error(
      "Firebase private key format is invalid - missing BEGIN/END markers",
      {
        hasBegin: privateKey.includes("BEGIN PRIVATE KEY"),
        hasEnd: privateKey.includes("END PRIVATE KEY"),
        keyStart: privateKey.substring(0, 50),
      },
    );
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });
    console.log(
      `[${new Date().toISOString()}] ✅ Firebase Admin SDK initialized for project: ${projectId}`,
    );
    return firebaseApp;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[${new Date().toISOString()}] ❌ Failed to initialize Firebase Admin SDK: ${errorMsg}`,
    );
    return null;
  }
};

/**
 * Verify Firebase ID token and extract user information
 */
export const verifyFirebaseToken = async (
  idToken: string,
): Promise<{
  uid: string;
  email: string | undefined;
  isAuthorized: boolean;
}> => {
  try {
    console.log(
      `[${new Date().toISOString()}] Starting token verification... Token length: ${idToken.length}`,
    );

    const app = initializeFirebaseAdmin();

    if (!app) {
      console.error(
        "Firebase Admin SDK is not initialized - check configuration",
      );
      throw new Error("Firebase Admin SDK not initialized");
    }

    console.log(
      `[${new Date().toISOString()}] Firebase Admin SDK initialized, verifying token...`,
    );

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    console.log(
      `[${new Date().toISOString()}] Token decoded successfully. UID: ${decodedToken.uid}, Email: ${decodedToken.email}`,
    );

    const email = decodedToken.email;
    const authorizedEmails = process.env.VITE_AUTHORIZED_EMAILS || "";

    console.log(
      `[${new Date().toISOString()}] Authorized emails from env: "${authorizedEmails}"`,
    );

    // Parse authorized emails from environment variable
    const emailList = authorizedEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    console.log(
      `[${new Date().toISOString()}] Parsed email list: ${JSON.stringify(emailList)}`,
    );

    let isAuthorized = false;

    if (emailList.length > 0 && email) {
      const lowerEmail = email.toLowerCase();
      isAuthorized = emailList.some((authorizedEmail) => {
        if (authorizedEmail.startsWith("@")) {
          return lowerEmail.endsWith(authorizedEmail);
        }
        return lowerEmail === authorizedEmail;
      });
    }

    console.log(
      `[${new Date().toISOString()}] Token verified - UID: ${decodedToken.uid}, Email: ${email}, Authorized: ${isAuthorized}`,
    );

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAuthorized,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[${new Date().toISOString()}] Token verification failed: ${errorMsg}`,
    );
    console.error("Full error details:", error);
    throw new Error("Invalid or expired token");
  }
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  const app = initializeFirebaseAdmin();
  if (!app) {
    throw new Error("Firebase Admin SDK not initialized");
  }
  return admin.auth();
};
