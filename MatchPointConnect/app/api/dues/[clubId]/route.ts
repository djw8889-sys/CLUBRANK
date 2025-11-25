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

    const userId = request.nextUrl.searchParams.get("userId") || undefined;
    const dues = storage.getClubDues(params.clubId, userId);
    return ok(dues);
  } catch (error) {
    console.error("[GET /api/dues/:clubId] failed", error);
    return serverError("회비 조회 실패");
  }
}
