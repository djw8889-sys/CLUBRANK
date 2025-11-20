import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeFirebaseAdmin } from "./firebase-admin.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerClubRoutes } from "./routes/clubs.js";
import { registerMembershipRoutes } from "./routes/memberships.js";
import { registerMeetingRoutes } from "./routes/meetings.js";
import { registerRankingRoutes } from "./routes/rankings.js";
import { registerClubAdminRoutes } from "./routes/club-admin.js";

dotenv.config();

const app = express();
app.use(express.json());

// --------------------------------------------------
// 🔥 Codespaces CORS 자동 설정
// --------------------------------------------------
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ||
  (() => {
    const host = process.env.CODESPACE_NAME;
    return host
      ? `https://${host}-5173.app.github.dev`
      : "http://localhost:5173";
  })();

console.log("🌐 Allow-Origin:", CLIENT_ORIGIN);

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight OPTIONS 요청 처리
app.options("*", cors());

// --------------------------------------------------
// Firebase Admin 초기화
// --------------------------------------------------
try {
  initializeFirebaseAdmin();
  console.log("🔥 Firebase Admin initialized");
} catch (err) {
  console.log("⚠️  Firebase Admin not initialized - credentials not found");
}

// --------------------------------------------------
// API 라우트 등록
// --------------------------------------------------
registerUserRoutes(app);
registerClubRoutes(app);
registerMembershipRoutes(app);
registerMeetingRoutes(app);
registerRankingRoutes(app);
registerClubAdminRoutes(app);

// --------------------------------------------------
// 서버 실행 (포트 5000)
// --------------------------------------------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
