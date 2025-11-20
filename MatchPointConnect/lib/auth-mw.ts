/**
 * Auth Middleware (DEV-friendly version)
 *
 * ✔ Development (NODE_ENV !== 'production'):
 *    - DEV_AUTH_BYPASS=true 이면 무조건 dev-user-1 주입
 *    - 또는 token === DEV_TEST_TOKEN 이어도 dev-user-1 주입
 *
 * ✔ Production (NODE_ENV === 'production'):
 *    - Firebase Admin verify ONLY
 */

import type { Request, Response, NextFunction } from "express";
import { verifyFirebaseToken } from "../server/firebase-admin.js";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Invalid Authorization header format" });
    }

    const token = parts[1];

    // ============================================================
    // 🔥 DEVELOPMENT MODE BYPASS
    // ============================================================
    const isDev = process.env.NODE_ENV !== "production";
    const devBypass = process.env.DEV_AUTH_BYPASS === "true";
    const devTestToken = process.env.DEV_TEST_TOKEN || "INVALID_TOKEN_TEST";

    if (isDev && (devBypass || token === devTestToken)) {
      console.warn("ℹ️ [auth-mw] DEV MODE → Authentication bypassed. Injecting dev-user-1.");
      (req as any).user = { uid: "dev-user-1", email: "dev@example.com" };
      return next();
    }

    // ============================================================
    // 🔒 PRODUCTION MODE → REAL FIREBASE TOKEN VERIFICATION
    // ============================================================
    const decoded = await verifyFirebaseToken(token);
    (req as any).user = decoded;
    return next();

  } catch (error: any) {
    console.error("❌ [auth-mw] Authentication failed:", error?.message || error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default authMiddleware;
