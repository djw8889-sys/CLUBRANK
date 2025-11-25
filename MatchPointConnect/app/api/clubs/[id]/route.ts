import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { storage } from "@/lib/storage";
import { notFound, ok, serverError } from "@/lib/server/respond";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const club = storage.getClubById(params.id);
    if (!club) {
      return notFound("클럽을 찾을 수 없습니다.");
    }

    return ok(club);
  } catch (error) {
    console.error("[GET /api/clubs/:id] failed", error);
    return serverError("클럽 조회 실패");
  }
}
