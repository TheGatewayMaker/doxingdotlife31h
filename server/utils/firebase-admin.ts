import admin from "firebase-admin";

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App;

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    console.log(
      `[${new Date().toISOString()}] Firebase Admin SDK already initialized`,
    );
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
        projectId: projectId || "MISSING",
        privateKey: privateKey ? `${privateKey.length} chars` : "MISSING",
        clientEmail: clientEmail || "MISSING",
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

  // After processing, revalidate the newlines are actually in the key
  privateKey = privateKey.trim();

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
        keyStart: privateKey.substring(0, 80),
        keyLength: privateKey.length,
      },
    );
    return null;
  }

  try {
    console.log(
      `[${new Date().toISOString()}] Initializing Firebase Admin SDK with project: ${projectId}`,
    );
    console.log(`Client email: ${clientEmail}`);
    console.log(`Private key length: ${privateKey.length} chars`);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });
    console.log(
      `[${new Date().toISOString()}] ✅ Firebase Admin SDK initialized successfully for project: ${projectId}`,
    );
    return firebaseApp;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[${new Date().toISOString()}] ❌ Failed to initialize Firebase Admin SDK: ${errorMsg}`,
    );
    console.error("Error details:", error);
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

    // Verify token is a non-empty string
    if (!idToken || typeof idToken !== "string" || idToken.trim().length === 0) {
      console.error("Token is invalid: empty or not a string", {
        tokenType: typeof idToken,
        tokenLength: idToken?.length || 0,
      });
      throw new Error("Token is empty or invalid format");
    }

    const app = initializeFirebaseAdmin();

    if (!app) {
      console.error(
        "Firebase Admin SDK is not initialized - check configuration",
      );
      console.error("Environment variables check:", {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50),
      });
      throw new Error(
        "Firebase Admin SDK not initialized - check env variables FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL",
      );
    }

    console.log(
      `[${new Date().toISOString()}] Firebase Admin SDK initialized, verifying token...`,
    );

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (verifyError) {
      const errorMsg =
        verifyError instanceof Error ? verifyError.message : String(verifyError);
      console.error(
        `[${new Date().toISOString()}] Firebase token verification error: ${errorMsg}`,
      );
      console.error("Verification error details:", {
        errorName: verifyError instanceof Error ? verifyError.name : "unknown",
        errorCode: (verifyError as any)?.code || "no-code",
        message: errorMsg,
      });

      // Provide more specific error messages
      if (
        errorMsg.includes("Token used too early") ||
        errorMsg.includes("iat")
      ) {
        throw new Error("Token used too early (clock skew issue)");
      } else if (
        errorMsg.includes("Token expired") ||
        errorMsg.includes("exp")
      ) {
        throw new Error("Token has expired - please sign in again");
      } else if (errorMsg.includes("invalid") || errorMsg.includes("malformed")) {
        throw new Error(
          "Token is malformed or invalid - please sign in again",
        );
      } else {
        throw new Error(`Firebase token verification failed: ${errorMsg}`);
      }
    }

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
    throw error instanceof Error
      ? error
      : new Error("Invalid or expired token");
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
