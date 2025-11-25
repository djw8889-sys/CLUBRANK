import admin from "firebase-admin";

const globalForFirebase = globalThis as unknown as {
  firebaseApp?: admin.app.App;
  serviceAccount?: any;
};

function loadServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️ Firebase Admin service account not fully configured");
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

function ensureFirebaseApp() {
  if (globalForFirebase.firebaseApp) return globalForFirebase.firebaseApp;

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    return null;
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKey: serviceAccount.privateKey,
    }),
  });

  globalForFirebase.firebaseApp = app;
  globalForFirebase.serviceAccount = serviceAccount;
  return app;
}

export function getFirebaseAdminApp() {
  return ensureFirebaseApp();
}

export function getAdminDb() {
  const app = ensureFirebaseApp();
  if (!app) return null;
  return admin.firestore(app);
}

export async function verifyFirebaseToken(token: string) {
  const app = ensureFirebaseApp();

  if (app) {
    return admin.auth(app).verifyIdToken(token);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Firebase Admin not initialized in production");
  }

  console.warn("⚠️ Using mock Firebase token verification (dev only)");
  const parts = token.split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
  return {
    uid: payload.user_id || payload.sub || "mock-user",
    email: payload.email,
    iat: payload.iat,
    exp: payload.exp,
  };
}
