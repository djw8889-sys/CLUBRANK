import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { badRequest, ok, serverError, notFound } from "@/lib/server/respond";
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
    const updated = storage.joinMeeting(meetingId, userId!);

    if (!updated) {
      return badRequest("모임 참가 실패 (정원 초과 또는 이미 참가)");
    }

    return ok(updated);
  } catch (error) {
    console.error("[POST /api/meetings/:id/join] failed", error);
    return serverError("모임 참가 실패");
  }
}
