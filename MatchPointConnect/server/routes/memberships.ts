import type { Express, Request, Response } from "express";
import { authenticateUser } from "../auth.js";
import { storage } from "../storage.js";

/**
 * 클럽 멤버십 조회 API
 * GET /api/users/:userId/memberships
 * 클라이언트 use-clubs.tsx 가 기대하는 구조:
 * [
 *   { membership: {...}, club: {...} }
 * ]
 */
export function registerMembershipRoutes(app: Express) {
  app.get(
    "/api/users/:userId/memberships",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.userId;

        console.log(`🔍 Fetch memberships for user ${userId}`);

        // 기본 클럽 자동생성
        await storage.ensureDefaultMembership(userId);

        // 멤버십 리스트 반환
        const memberships = storage.getUserClubMemberships(userId);

        return res.json(memberships);
      } catch (error: any) {
        console.error("❌ memberships error:", error);
        return res
          .status(500)
          .json({ error: "멤버십 정보를 불러올 수 없습니다." });
      }
    }
  );
}
