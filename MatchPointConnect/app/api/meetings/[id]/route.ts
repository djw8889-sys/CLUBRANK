import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { notFound, ok, serverError } from "@/lib/server/respond";
import { parseJsonBody } from "@/lib/server/parse-body";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const meetingId = Number(params.id);
    const updates = await parseJsonBody<Record<string, any>>(request);
    if (updates instanceof Response) return updates;

    const updated = storage.updateMeeting(meetingId, updates);
    if (!updated) return notFound("모임을 찾을 수 없습니다.");
    return ok(updated);
  } catch (error) {
    console.error("[PATCH /api/meetings/:id] failed", error);
    return serverError("모임 업데이트 실패");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const meetingId = Number(params.id);
    const deleted = storage.deleteMeeting(meetingId);
    if (!deleted) return notFound("모임을 찾을 수 없습니다.");
    return ok({ success: true });
  } catch (error) {
    console.error("[DELETE /api/meetings/:id] failed", error);
    return serverError("모임 삭제 실패");
  }
}
