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

    const partnershipStats = await storage.getPartnershipStats(
      params.userId,
      clubId,
    );
    const partnerships = partnershipStats.map((stat) => ({
      partnerId: stat.partnerId,
      wins: stat.wins,
      losses: stat.losses,
      draws: stat.draws,
      gamesPlayed: stat.gamesPlayed,
      winRate: stat.winRate.toFixed(1),
    }));

    return ok({ partnerships });
  } catch (error) {
    console.error(
      "[GET /api/clubs/:clubId/user/:userId/partnerships] failed",
      error,
    );
    return serverError("파트너십 분석을 가져올 수 없습니다.");
  }
}
