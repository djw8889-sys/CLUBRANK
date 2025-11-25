import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { ok, serverError } from "@/lib/server/respond";
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
    const updated = storage.leaveMeeting(meetingId, userId!);
    return ok(updated);
  } catch (error) {
    console.error("[POST /api/meetings/detail/:meetingId/leave] failed", error);
    return serverError("모임 취소 실패");
  }
}
