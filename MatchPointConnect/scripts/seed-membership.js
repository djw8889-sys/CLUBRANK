// scripts/seed-membership.js
import "dotenv/config";
import fs from "fs";
import path from "path";
import url from "url";
import admin from "firebase-admin";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// 🔧 Firebase Admin 초기화
// ======================================================
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "match-point-0918";
const CLIENT_EMAIL =
  process.env.FIREBASE_CLIENT_EMAIL ||
  "firebase-adminsdk-fbsvc@match-point-0918.iam.gserviceaccount.com";
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

// 서비스 계정 JSON 경로 (있으면 먼저 사용)
const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, "../server/match-point-0918-firebase-adminsdk-fbsvc-2bee9bb142.json");

function initFirebaseAdmin() {
  if (admin.apps.length > 0) return;

  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.log("🔑 Using service account JSON:", SERVICE_ACCOUNT_PATH);
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY) {
    console.log("🔑 Using FIREBASE_* env vars");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: PROJECT_ID,
        clientEmail: CLIENT_EMAIL,
        privateKey: PRIVATE_KEY,
      }),
    });
  } else {
    throw new Error("Firebase Admin credential not found!");
  }
}

initFirebaseAdmin();
const db = admin.firestore();

// ======================================================
// 🔥 ADMIN 역할을 부여할 유저 지정
// ======================================================
// ※ 진우님 최신 UID로 자동 반영됨 (콘솔에서 확인했음)
//    ahJqQ8a2vneg8P7ZhmJhFiRj3ag2
// ======================================================
const TARGET_USERS = [
  { uid: "dev-user-1", role: "admin" },
  { uid: "ahJqQ8a2vneg8P7ZhmJhFiRj3ag2", role: "admin" }, // ← 진우님 계정
];

// 데모 클럽 ID
const CLUB_ID = "club-demo-001";

async function seedForUser(user) {
  const { uid, role } = user;
  const membershipId = `${uid}_${CLUB_ID}`;

  console.log(`🚀 Seeding membership for uid=${uid}, role=${role}`);

  // 1) 클럽 생성/업데이트
  const clubRef = db.collection("clubs").doc(CLUB_ID);
  await clubRef.set(
    {
      id: CLUB_ID,
      name: "Demo Tennis Club",
      description: "개발/테스트용 데모 테니스 클럽",
      region: "서울/경기",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 2) memberships 루트 컬렉션
  const membershipRef = db.collection("memberships").doc(membershipId);
  await membershipRef.set(
    {
      id: membershipId,
      clubId: CLUB_ID,
      userId: uid,
      role: role, // ★★ 여기서 관리자 역할 설정
      status: "active",
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 3) users/{uid}/memberships 서브 컬렉션
  const userMembershipRef = db
    .collection("users")
    .doc(uid)
    .collection("memberships")
    .doc(membershipId);

  await userMembershipRef.set(
    {
      id: membershipId,
      clubId: CLUB_ID,
      userId: uid,
      role: role, // ★★ 여기서도 관리자 역할
      status: "active",
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`✅ Completed for uid=${uid}`);
}

async function main() {
  try {
    for (const user of TARGET_USERS) {
      await seedForUser(user);
    }
    console.log("🎉 All done! Created/updated memberships with admin roles");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

main();
