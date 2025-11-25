import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { storage } from "@/lib/storage";
import { notFound, ok, serverError } from "@/lib/server/respond";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const clubId = params.id;
    const club = storage.getClubById(clubId);
    if (!club) {
      return notFound("클럽을 찾을 수 없습니다.");
    }

    const members = storage.getClubMembers(clubId);
    return ok(members);
  } catch (error) {
    console.error("[GET /api/clubs/:id/members] failed", error);
    return serverError("멤버 조회 실패");
  }
}
