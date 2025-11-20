import type { Express, Request, Response } from "express";
import { authenticateUser } from "../auth.js";
import { storage } from "../storage.js";

/**
 * Club 관련 API 라우트 등록
 */
export function registerClubRoutes(app: Express) {

  /* --------------------------------------------------
     🔥 1) 표준 멤버십 API
     클라이언트 use-clubs.tsx가 호출하는 엔드포인트
     GET /api/users/:userId/memberships
  -------------------------------------------------- */
  app.get(
    "/api/users/:userId/memberships",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const requestedUser = req.params.userId;
        const authedUser = (req as any).user?.uid;

        // 보안 방어 — 본인만 조회 가능
        if (requestedUser !== authedUser) {
          return res.status(403).json({ error: "권한이 없습니다." });
        }

        // 기본 클럽 자동 생성
        await storage.ensureDefaultMembership(authedUser);

        // 멤버십 + 클럽 데이터 구성
        const memberships = storage.getUserClubMemberships(authedUser);

        return res.json(memberships);
      } catch (error: any) {
        console.error("❌ [/api/users/:id/memberships] failed:", error);
        return res.status(500).json({ error: "멤버십 조회 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 2) 기존 /api/clubs/my-membership 유지 (호환성)
  -------------------------------------------------- */
  app.get(
    "/api/clubs/my-membership",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.uid;
        if (!userId) {
          return res.status(401).json({ error: "인증 정보가 없습니다." });
        }

        await storage.ensureDefaultMembership(userId);
        const memberships = storage.getUserClubMemberships(userId);

        return res.json(memberships);
      } catch (error) {
        console.error("❌ [/api/clubs/my-membership] failed:", error);
        return res.status(500).json({ error: "멤버십 조회 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 3) 클럽 단건 조회
  -------------------------------------------------- */
  app.get(
    "/api/clubs/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const id = req.params.id;
        const club = storage.getClubById(id);

        if (!club) {
          return res.status(404).json({ error: "클럽을 찾을 수 없습니다." });
        }

        return res.json(club);
      } catch (error) {
        console.error("❌ [GET /api/clubs/:id] failed:", error);
        return res.status(500).json({ error: "클럽 조회 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 4) 클럽 멤버 목록 조회
  -------------------------------------------------- */
  app.get(
    "/api/clubs/:id/members",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const clubId = req.params.id;
        const club = storage.getClubById(clubId);

        if (!club) {
          return res.status(404).json({ error: "클럽을 찾을 수 없습니다." });
        }

        const members = storage.getClubMembers(clubId);
        return res.json(members);
      } catch (error) {
        console.error("❌ [GET /api/clubs/:id/members] failed:", error);
        return res.status(500).json({ error: "멤버 조회 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 5) 클럽 탈퇴
  -------------------------------------------------- */
  app.post(
    "/api/clubs/:id/leave",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const clubId = req.params.id;
        const userId = (req as any).user?.uid;

        storage.leaveClub(userId, clubId);
        return res.json({ success: true });
      } catch (error) {
        console.error("❌ [POST /api/clubs/:id/leave] failed:", error);
        return res.status(500).json({ error: "클럽 탈퇴 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 6) 클럽 생성 시 owner + members 자동 설정
  -------------------------------------------------- */
  app.post(
    "/api/clubs",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.uid;
        const { name, region, description, logoUrl, bannerUrl, primaryColor } =
          req.body;

        if (!name) {
          return res.status(400).json({ error: "클럽 이름은 필수입니다." });
        }

        const newClub = storage.createClub({
          name,
          region,
          description,
          logoUrl,
          bannerUrl,
          primaryColor,
          owner: userId,
          members: [userId],
        });

        return res.status(201).json(newClub);
      } catch (error) {
        console.error("❌ [POST /api/clubs] failed:", error);
        return res.status(500).json({ error: "클럽 생성 실패" });
      }
    }
  );
}
