import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerClubRoutes } from "./routes/clubs.js";
import { registerRankingRoutes } from "./routes/rankings.js";
import { registerClubAdminRoutes } from "./routes/club-admin.js";

const app = express();

// ✅ Railway는 PORT 환경변수를 자동으로 지정함
const PORT = process.env.PORT || 5000;

// ✅ 환경변수 확인
console.log(
  "🔥 ENV loaded:",
  process.env.FIREBASE_PROJECT_ID || "❌ Not Found",
);

// ✅ CORS 설정 (Authorization 허용)
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Vite dev server, local scripts, or Codespaces preview URLs
      const isAllowed =
        !origin ||
        allowedOrigins.includes(origin) ||
        /https?:\/\/.+\.preview\.app\.github\.dev$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn("🚫 Blocked CORS origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json());

// ✅ ESM 경로 계산
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 정적 파일
const publicDir = path.resolve(__dirname, "../public");
app.use(express.static(publicDir));

// ✅ API 라우트
registerClubRoutes(app);
registerRankingRoutes(app);
registerClubAdminRoutes(app);

// ✅ SPA 라우팅
app.get("*", (_, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
