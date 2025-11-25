import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/respond";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { meetingId: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const meetingId = Number(params.meetingId);
    const userId = auth.user?.uid;
    const updated = storage.joinMeeting(meetingId, userId!);

    if (!updated) {
      return badRequest("참가할 수 없습니다.");
    }

    return ok(updated);
  } catch (error) {
    console.error("[POST /api/meetings/detail/:meetingId/join] failed", error);
    return serverError("모임 참가 실패");
  }
}
