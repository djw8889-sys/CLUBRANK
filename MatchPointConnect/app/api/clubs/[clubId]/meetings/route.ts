import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { created, ok, serverError } from "@/lib/server/respond";
import { parseJsonBody } from "@/lib/server/parse-body";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const meetings = storage.getClubMeetings(params.clubId);
    return ok(meetings);
  } catch (error) {
    console.error("[GET /api/clubs/:clubId/meetings] failed", error);
    return serverError("모임 조회 실패");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const body = await parseJsonBody<Record<string, any>>(request);
    if (body instanceof Response) return body;

    const userId = auth.user?.uid;
    const newMeeting = storage.createMeeting({
      ...body,
      clubId: params.clubId,
      owner: userId,
    });

    return created(newMeeting);
  } catch (error) {
    console.error("[POST /api/clubs/:clubId/meetings] failed", error);
    return serverError("모임 생성 실패");
  }
}
