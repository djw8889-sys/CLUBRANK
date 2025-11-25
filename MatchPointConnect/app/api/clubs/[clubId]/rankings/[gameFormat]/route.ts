import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/respond";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

const validFormats = [
  "mens_singles",
  "womens_singles",
  "mens_doubles",
  "womens_doubles",
  "mixed_doubles",
];

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string; gameFormat: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const clubId = Number(params.clubId);
    if (Number.isNaN(clubId)) return badRequest("Invalid club ID");
    if (!validFormats.includes(params.gameFormat))
      return badRequest("Invalid game format");

    const rankings = await storage.getClubRankingsByFormat(
      clubId,
      params.gameFormat,
    );
    return ok({ rankings });
  } catch (error) {
    console.error("[GET /api/clubs/:clubId/rankings/:gameFormat] failed", error);
    return serverError("클럽 랭킹을 가져올 수 없습니다.");
  }
}
