import admin from "firebase-admin";

/**
 * Firebase 서비스 계정 로드
 */
function loadServiceAccount() {
  try {
    // 1) FULL JSON (Railway 변수) 사용
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      if (parsed.private_key && typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }

      return parsed;
    }

    // 2) 개별 환경변수 사용
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) return null;

    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  } catch (e) {
    console.error("❌ Firebase service account JSON 파싱 실패:", e);
    return null;
  }
}

let serviceAccount: any = null;

/**
 * ✅ index.ts에서 호출되는 메인 초기화 함수
 */
export function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    return; // 이미 초기화됨
  }

  serviceAccount = loadServiceAccount();

  if (!serviceAccount) {
    console.warn("⚠️ Firebase Admin 초기화 안 됨 - 서비스 계정 없음");
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("🔥 Firebase Admin initialized");
}

export const adminDb = () => {
  if (!serviceAccount) return null;
  return admin.firestore();
};

/**
 * Firebase 토큰 검증
 */
export async function verifyFirebaseToken(token: string) {
  console.log("🔍 [FIREBASE ADMIN] verifyFirebaseToken called");

  // 1) 실제 Firebase Admin 검증
  if (serviceAccount) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return decoded;
    } catch (error: any) {
      console.error("❌ Firebase Token invalid:", error.message);
      throw new Error("Invalid Firebase token");
    }
  }

  // 2) 개발용 MOCK 인증 (Firebase Admin 없음)
  if (process.env.NODE_ENV === "production") {
    throw new Error("Firebase Admin not initialized in production");
  }

  console.warn("⚠️ Mock Firebase 인증 사용 (개발 모드)");

  try {
    const parts = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    return {
      uid: payload.user_id || payload.sub || "mock-user",
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (e) {
    throw new Error("Invalid mock token format");
  }
}

export default admin;
