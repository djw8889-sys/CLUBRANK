import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { ok, serverError } from "@/lib/server/respond";
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
    console.error("[GET /api/meetings/list/:clubId] failed", error);
    return serverError("모임 조회 실패");
  }
}
