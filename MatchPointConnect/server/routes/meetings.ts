import type { Express, Request, Response } from "express";
import { authenticateUser } from "../auth.js";   // ✅ 수정된 부분
import { storage } from "../storage.js";

/**
 * Meeting Routes
 */
export function registerMeetingRoutes(app: Express) {
  /* --------------------------------------------------
     🔥 1) 클럽 모임 목록 조회
  -------------------------------------------------- */
  app.get(
    "/api/clubs/:clubId/meetings",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const { clubId } = req.params;

        const meetings = storage.getClubMeetings(clubId);
        return res.json(meetings);
      } catch (error) {
        console.error("❌ [GET /api/clubs/:clubId/meetings] failed:", error);
        return res.status(500).json({ error: "모임 조회 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 2) 모임 단건 조회
  -------------------------------------------------- */
  app.get(
    "/api/meetings/:meetingId",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const meetingId = Number(req.params.meetingId);

        const meeting = storage.getMeetingById(meetingId);
        if (!meeting) {
          return res.status(404).json({ error: "모임을 찾을 수 없습니다." });
        }

        return res.json(meeting);
      } catch (error) {
        console.error("❌ [GET /api/meetings/:meetingId] failed:", error);
        return res.status(500).json({ error: "모임 조회 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 3) 모임 생성
  -------------------------------------------------- */
  app.post(
    "/api/clubs/:clubId/meetings",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const clubId = req.params.clubId;
        const userId = (req as any).user?.uid;

        const newMeeting = storage.createMeeting({
          ...req.body,
          clubId,
          owner: userId,
        });

        return res.status(201).json(newMeeting);
      } catch (error) {
        console.error("❌ [POST /api/clubs/:clubId/meetings] failed:", error);
        return res.status(500).json({ error: "모임 생성 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 4) 모임 참가
  -------------------------------------------------- */
  app.post(
    "/api/meetings/:meetingId/join",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const meetingId = Number(req.params.meetingId);
        const userId = (req as any).user?.uid;

        const updated = storage.joinMeeting(meetingId, userId);

        if (!updated) {
          return res.status(400).json({ error: "참가할 수 없습니다." });
        }

        return res.json(updated);
      } catch (error) {
        console.error("❌ [POST /api/meetings/:meetingId/join] failed:", error);
        return res.status(500).json({ error: "모임 참가 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 5) 모임 참가 취소
  -------------------------------------------------- */
  app.post(
    "/api/meetings/:meetingId/leave",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const meetingId = Number(req.params.meetingId);
        const userId = (req as any).user?.uid;

        const updated = storage.leaveMeeting(meetingId, userId);
        return res.json(updated);
      } catch (error) {
        console.error("❌ [POST /api/meetings/:meetingId/leave] failed:", error);
        return res.status(500).json({ error: "모임 취소 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 6) 모임 업데이트
  -------------------------------------------------- */
  app.put(
    "/api/meetings/:meetingId",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const meetingId = Number(req.params.meetingId);
        const updates = req.body;

        const updated = storage.updateMeeting(meetingId, updates);
        return res.json(updated);
      } catch (error) {
        console.error("❌ [PUT /api/meetings/:meetingId] failed:", error);
        return res.status(500).json({ error: "모임 업데이트 실패" });
      }
    }
  );

  /* --------------------------------------------------
     🔥 7) 모임 삭제
  -------------------------------------------------- */
  app.delete(
    "/api/meetings/:meetingId",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const meetingId = Number(req.params.meetingId);

        const success = storage.deleteMeeting(meetingId);
        return res.json({ success });
      } catch (error) {
        console.error("❌ [DELETE /api/meetings/:meetingId] failed:", error);
        return res.status(500).json({ error: "모임 삭제 실패" });
      }
    }
  );
}
