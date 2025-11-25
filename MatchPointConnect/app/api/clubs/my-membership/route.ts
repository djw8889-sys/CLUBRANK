import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { storage } from "@/lib/storage";
import { ok, serverError, unauthorized } from "@/lib/server/respond";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const userId = auth.user?.uid;
    if (!userId) {
      return unauthorized("인증 정보가 없습니다.");
    }

    await storage.ensureDefaultMembership(userId);
    const memberships = storage.getUserClubMemberships(userId);
    return ok(memberships);
  } catch (error) {
    console.error("[/api/clubs/my-membership] failed", error);
    return serverError("멤버십 조회 실패");
  }
}
