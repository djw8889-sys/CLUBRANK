import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { notFound, ok, serverError } from "@/lib/server/respond";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const meetingId = Number(params.id);
    const userId = auth.user?.uid;
    const updated = storage.leaveMeeting(meetingId, userId!);

    if (!updated) {
      return notFound("모임을 찾을 수 없습니다.");
    }

    return ok(updated);
  } catch (error) {
    console.error("[POST /api/meetings/:id/leave] failed", error);
    return serverError("모임 참가 취소 실패");
  }
}
