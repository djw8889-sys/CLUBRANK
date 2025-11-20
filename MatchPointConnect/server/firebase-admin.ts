import admin from "firebase-admin";

// ✅ Firebase 서비스 계정 로드 로직
function loadServiceAccount() {
  try {
    // 1️⃣ Railway에서 FIREBASE_SERVICE_ACCOUNT (JSON 전체) 사용
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      // 🔥 여기서 줄바꿈 복원
      if (parsed.private_key && typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }

      return parsed;
    }

    // 2️⃣ 개별 변수로 세팅한 경우 fallback
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      return null;
    }

    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  } catch (error) {
    console.error("❌ Firebase service account JSON 파싱 실패:", error);
    return null;
  }
}

const serviceAccount = loadServiceAccount();

// ✅ Firebase Admin 초기화
const firebaseApp = (() => {
  if (admin.apps.length) {
    return admin.app();
  }

  if (serviceAccount) {
    console.log("✅ Firebase Admin initializing with service account");
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: (serviceAccount as any).project_id || process.env.FIREBASE_PROJECT_ID,
    });
  }

  console.warn("⚠️  Firebase Admin credentials not found. Attempting application default credentials.");
  try {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error);
    return null;
  }
})();

export const adminDb = firebaseApp ? admin.firestore() : null;

// ✅ 토큰 검증 유틸 (개발 모드 fallback 지원, 프로덕션 fail-closed)
export const verifyFirebaseToken = async (token: string) => {
  console.log("🔍 [FIREBASE ADMIN] verifyFirebaseToken called");
  console.log("🔍 [FIREBASE ADMIN] Environment:", process.env.NODE_ENV || 'development');
  console.log("🔍 [FIREBASE ADMIN] serviceAccount exists:", !!serviceAccount);
  
  // 🔥 Firebase Admin이 초기화된 경우 → 실제 검증
  if (serviceAccount) {
    console.log("✅ [FIREBASE ADMIN] Using real Firebase Admin verification");
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      console.log("✅ [FIREBASE ADMIN] Token verified successfully, uid:", decoded.uid);
      return decoded;
    } catch (error: any) {
      console.error("❌ [FIREBASE ADMIN] Token verification failed:", error.message);
      console.error("❌ [FIREBASE ADMIN] Error code:", error.code);
      throw new Error("Invalid or expired token");
    }
  }
  
  // 🚨 PRODUCTION: Firebase 인증 필수 - credentials 없으면 실패
  if (process.env.NODE_ENV === 'production') {
    console.error("🚨 [FIREBASE ADMIN] CRITICAL: Firebase credentials missing in production!");
    console.error("🚨 [FIREBASE ADMIN] Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY");
    throw new Error("Firebase Admin not initialized - authentication unavailable in production");
  }
  
  // 🛠️ DEVELOPMENT ONLY: Mock 인증 fallback (로컬 개발 전용)
  console.warn("⚠️  [FIREBASE ADMIN] Using MOCK authentication (DEVELOPMENT MODE ONLY)");
  console.warn("⚠️  [FIREBASE ADMIN] This will NOT work in production!");
  console.warn("⚠️  [FIREBASE ADMIN] Set FIREBASE credentials for production deployment!");
  
  try {
    // JWT 토큰에서 payload 추출 (검증 없이)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log("🔍 [FIREBASE ADMIN] Mock auth - extracted uid:", payload.user_id || payload.sub);
    
    return {
      uid: payload.user_id || payload.sub || 'mock-user-id',
      email: payload.email || 'mock@example.com',
      email_verified: true,
      auth_time: payload.auth_time,
      iat: payload.iat,
      exp: payload.exp,
      firebase: {
        sign_in_provider: payload.firebase?.sign_in_provider || 'google.com'
      }
    };
  } catch (error: any) {
    console.error("❌ [FIREBASE ADMIN] Mock auth failed:", error.message);
    throw new Error("Invalid token format");
  }
};

export default admin;
