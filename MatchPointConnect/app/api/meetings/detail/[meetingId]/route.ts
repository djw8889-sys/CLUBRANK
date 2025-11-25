import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { notFound, ok, serverError } from "@/lib/server/respond";
import { parseJsonBody } from "@/lib/server/parse-body";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { meetingId: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const meetingId = Number(params.meetingId);
    const meeting = storage.getMeetingById(meetingId);
    if (!meeting) return notFound("모임을 찾을 수 없습니다.");
    return ok(meeting);
  } catch (error) {
    console.error("[GET /api/meetings/detail/:meetingId] failed", error);
    return serverError("모임 조회 실패");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { meetingId: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const meetingId = Number(params.meetingId);
    const body = await parseJsonBody<Record<string, any>>(request);
    if (body instanceof Response) return body;

    const updated = storage.updateMeeting(meetingId, body);
    return ok(updated);
  } catch (error) {
    console.error("[PUT /api/meetings/detail/:meetingId] failed", error);
    return serverError("모임 업데이트 실패");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { meetingId: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const meetingId = Number(params.meetingId);
    const success = storage.deleteMeeting(meetingId);
    return ok({ success });
  } catch (error) {
    console.error("[DELETE /api/meetings/detail/:meetingId] failed", error);
    return serverError("모임 삭제 실패");
  }
}
