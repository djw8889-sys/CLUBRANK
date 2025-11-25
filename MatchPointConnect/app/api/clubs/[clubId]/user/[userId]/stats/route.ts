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

    const matchHistory = await storage.getUserMatchHistory(
      params.userId,
      clubId,
    );
    const rankings = await storage.getUserRankingPoints(params.userId, clubId);

    const statsByFormat: Record<string, any> = {};
    for (const ranking of rankings) {
      statsByFormat[ranking.gameFormat] = {
        rankingPoints: ranking.rankingPoints,
        wins: ranking.wins,
        losses: ranking.losses,
        draws: ranking.draws,
        gamesPlayed: ranking.wins + ranking.losses + ranking.draws,
        winRate:
          ranking.wins + ranking.losses + ranking.draws > 0
            ? (
                (ranking.wins /
                  (ranking.wins + ranking.losses + ranking.draws)) *
                100
              ).toFixed(1)
            : 0,
      };
    }

    return ok({ matchHistory, statsByFormat, totalMatches: matchHistory.length });
  } catch (error) {
    console.error("[GET /api/clubs/:clubId/user/:userId/stats] failed", error);
    return serverError("사용자 통계를 가져올 수 없습니다.");
  }
}
