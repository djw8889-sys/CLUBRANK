import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { storage } from "@/lib/storage";
import { forbidden, ok, serverError } from "@/lib/server/respond";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const requestedUser = params.userId;
    const authedUser = auth.user?.uid;

    if (requestedUser !== authedUser) {
      return forbidden("권한이 없습니다.");
    }

    await storage.ensureDefaultMembership(authedUser);
    const memberships = storage.getUserClubMemberships(authedUser);
    return ok(memberships);
  } catch (error) {
    console.error("[/api/users/:id/memberships] failed", error);
    return serverError("멤버십 조회 실패");
  }
}
