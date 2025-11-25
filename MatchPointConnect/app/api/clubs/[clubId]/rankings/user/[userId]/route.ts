import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/respond";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string; userId: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const clubId = Number(params.clubId);
    if (Number.isNaN(clubId)) return badRequest("Invalid club ID");

    const rankings = await storage.getUserRankingPoints(params.userId, clubId);
    return ok({ rankings });
  } catch (error) {
    console.error("[GET /api/clubs/:clubId/rankings/user/:userId] failed", error);
    return serverError("랭킹 정보를 가져올 수 없습니다.");
  }
}
