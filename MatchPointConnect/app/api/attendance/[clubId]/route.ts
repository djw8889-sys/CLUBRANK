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

    const eventDateParam = request.nextUrl.searchParams.get("eventDate");
    const eventDate = eventDateParam ? new Date(eventDateParam) : undefined;
    const attendance = storage.getClubAttendance(params.clubId, eventDate);
    return ok(attendance);
  } catch (error) {
    console.error("[GET /api/attendance/:clubId] failed", error);
    return serverError("출석 조회 실패");
  }
}
