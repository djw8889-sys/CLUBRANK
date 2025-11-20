import type { Express, Request, Response, NextFunction } from "express";
import { authenticateUser } from "../auth.js"; // ✅ 미들웨어 형태로 변경됨
import { storage } from "../storage.js";
import { adminDb } from "../firebase-admin.js";

/**
 * Club 관련 API 라우트 등록
 */
export function registerClubRoutes(app: Express) {
  /**
   * ✅ 내 클럽 멤버십 목록 조회
   * - 로그인 사용자의 클럽 멤버십이 없을 경우 기본 클럽 자동 생성 및 가입
   * - 항상 최소 1개 이상의 클럽정보를 반환하도록 보장
   */
  app.get(
    "/api/clubs/my-membership",
    authenticateUser, // ✅ verifyFirebaseToken → authenticateUser 변경
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.uid;
        console.log("🔍 [DEBUG] /api/clubs/my-membership - userId:", userId);
        
        if (!userId) {
          console.log("❌ [DEBUG] No userId found in request");
          return res.status(401).json({ error: "인증 정보가 없습니다." });
        }

        // ✅ Firestore에서 멤버십 조회 (우선)
        if (adminDb) {
          const membershipSnap = await adminDb
            .collection("clubMemberships")
            .where("userId", "==", userId)
            .where("isActive", "==", true)
            .limit(1)
            .get();

          if (!membershipSnap.empty) {
            const membershipDoc = membershipSnap.docs[0];
            const membershipData = membershipDoc.data();
            const clubId = membershipData.clubId;

            const clubDoc = await adminDb.collection("clubs").doc(String(clubId)).get();
            const clubData = clubDoc.exists
              ? { id: clubDoc.id, ...clubDoc.data() }
              : null;

            const payload = [
              {
                membership: { id: membershipDoc.id, ...membershipData },
                club: clubData,
              },
            ].filter((c) => c.club);

            console.log("🔍 [DEBUG] Firestore membership response:", payload);
            return res.json({ items: payload });
          }
        }

        // ✅ 기본 클럽 자동 생성 (Firestore 데이터가 없는 경우)
        console.log("🔍 [DEBUG] Ensuring default membership for userId:", userId);
        await storage.ensureDefaultMembership(userId);

        // ✅ 멤버십 + 클럽 데이터 함께 반환
        const memberships = await storage.getUserClubMemberships(userId);
        console.log("🔍 [DEBUG] Raw memberships from storage:", JSON.stringify(memberships, null, 2));

        const clubs = await Promise.all(
          memberships.map(async (m) => {
            const clubId = m.membership?.clubId ?? m.club?.id;
            console.log("🔍 [DEBUG] Processing membership - clubId:", clubId);
            const clubData = m.club ?? (await storage.getClubById(clubId));
            console.log(
              "🔍 [DEBUG] Club data for clubId",
              clubId,
              ":",
              clubData ? "found" : "null",
            );
            return {
              membership: {
                id: m.membership?.clubId ?? m.club?.id,
                ...m.membership,
              },
              club: clubData,
            };
          }),
        );

        // ✅ Filter out null clubs for safety
        const validClubs = clubs.filter((c) => c.club !== null && c.club !== undefined);
        console.log("🔍 [DEBUG] Valid clubs count:", validClubs.length);
        console.log("🔍 [DEBUG] Sending response:", JSON.stringify({ items: validClubs }, null, 2));

        return res.json({ items: validClubs });
      } catch (error: any) {
        console.error("❌ [GET /api/clubs/my-membership] failed:", error);
        console.error("❌ [DEBUG] Error stack:", error.stack);
        res.status(500).json({ error: "클럽정보 로드 실패" });
      }
    },
  );

  /**
   * ✅ 클럽 단건 조회
   */
  app.get(
    "/api/clubs/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const id = req.params.id;
        const club = await storage.getClubById(id);

        if (!club) {
          return res.status(404).json({ error: "클럽을 찾을 수 없습니다." });
        }

        return res.json(club);
      } catch (error: any) {
        console.error("❌ [GET /api/clubs/:id] failed:", error);
        res.status(500).json({ error: "클럽 조회 실패" });
      }
    },
  );

  /**
   * ✅ 클럽 멤버 목록 조회
   * - Supports both numeric and string club IDs (e.g., "default-userId")
   */
  app.get(
    "/api/clubs/:id/members",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const clubId = req.params.id; // ✅ Keep as string to support default-${userId}
        
        if (!clubId) {
          return res.status(400).json({ error: "유효하지 않은 클럽 ID입니다." });
        }

        console.log(`🔍 [GET /api/clubs/${clubId}/members] Fetching members`);

        // ✅ 클럽 존재 여부 확인
        const club = await storage.getClubById(clubId);
        if (!club) {
          console.log(`❌ [GET /api/clubs/${clubId}/members] Club not found`);
          return res.status(404).json({ error: "클럽을 찾을 수 없습니다." });
        }

        // ✅ 클럽 멤버 조회
        const members = await storage.getClubMembers(clubId);
        console.log(`✅ [GET /api/clubs/${clubId}/members] Found ${members.length} members`);

        return res.json(members);
      } catch (error: any) {
        console.error("❌ [GET /api/clubs/:id/members] failed:", error);
        console.error("❌ [DEBUG] Error stack:", error.stack);
        res.status(500).json({ error: "멤버 조회 실패" });
      }
    },
  );

  /**
   * ✅ 클럽 탈퇴
   * - Supports both numeric and string club IDs (e.g., "default-userId")
   */
  app.post(
    "/api/clubs/:id/leave",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const clubId = req.params.id; // ✅ Keep as string to support default-${userId}
        const userId = (req as any).user?.uid;

        if (!clubId) {
          return res.status(400).json({ error: "유효하지 않은 클럽 ID입니다." });
        }

        if (!userId) {
          return res.status(401).json({ error: "인증 정보가 없습니다." });
        }

        console.log(`🔍 [POST /api/clubs/${clubId}/leave] User ${userId} leaving club`);

        // ✅ 클럽 탈퇴 처리
        await storage.leaveClub(userId, clubId);
        console.log(`✅ [POST /api/clubs/${clubId}/leave] User successfully left club`);

        return res.json({ success: true, message: "클럽 탈퇴 완료" });
      } catch (error: any) {
        console.error("❌ [POST /api/clubs/:id/leave] failed:", error);
        console.error("❌ [DEBUG] Error stack:", error.stack);
        res.status(500).json({ error: "클럽 탈퇴 실패" });
      }
    },
  );

  /**
   * ✅ 클럽 생성 (테스트용 or 관리자용)
   */
  app.post(
    "/api/clubs",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const { name, region, description, logoUrl, bannerUrl, primaryColor } =
          req.body;

        if (!name) {
          return res.status(400).json({ error: "클럽 이름은 필수입니다." });
        }

        const newClub = await storage.createClub({
          name,
          region,
          description,
          logoUrl,
          bannerUrl,
          primaryColor,
        });

        console.log(`✅ [POST /api/clubs] created:`, newClub.name);
        res.status(201).json(newClub);
      } catch (error: any) {
        console.error("❌ [POST /api/clubs] failed:", error);
        res.status(500).json({ error: "클럽 생성 실패" });
      }
    },
  );
}
