import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { storage } from "@/lib/storage";
import { ok, serverError } from "@/lib/server/respond";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const clubId = params.id;
    const userId = auth.user?.uid;

    storage.leaveClub(userId, clubId);
    return ok({ success: true });
  } catch (error) {
    console.error("[POST /api/clubs/:id/leave] failed", error);
    return serverError("클럽 탈퇴 실패");
  }
}
