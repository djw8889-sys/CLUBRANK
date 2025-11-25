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

    const attendanceId = Number(params.id);
    const body = await parseJsonBody<Record<string, any>>(request);
    if (body instanceof Response) return body;

    const updated = storage.updateAttendanceStatus(
      attendanceId,
      body.status,
      body.notes,
    );

    if (!updated) return notFound("출석 기록을 찾을 수 없습니다.");
    return ok(updated);
  } catch (error) {
    console.error("[PATCH /api/attendance/:id] failed", error);
    return serverError("출석 업데이트 실패");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const attendanceId = Number(params.id);
    const deleted = storage.deleteAttendance(attendanceId);
    if (!deleted) return notFound("출석 기록을 찾을 수 없습니다.");
    return ok({ success: true });
  } catch (error) {
    console.error("[DELETE /api/attendance/:id] failed", error);
    return serverError("출석 삭제 실패");
  }
}
