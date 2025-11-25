import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { ok, serverError } from "@/lib/server/respond";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    return ok({ message: "Match completion endpoint active" });
  } catch (error) {
    console.error("[POST /api/clubs/matches/:matchId/complete] failed", error);
    return serverError("경기 완료 처리 중 오류가 발생했습니다.");
  }
}
