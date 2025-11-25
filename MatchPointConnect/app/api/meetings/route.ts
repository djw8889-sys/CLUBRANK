import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { created, ok, serverError, badRequest } from "@/lib/server/respond";
import { parseJsonBody } from "@/lib/server/parse-body";
import { storage } from "@/lib/storage";
import { insertClubMeetingsSchema } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const body = await parseJsonBody<Record<string, any>>(request);
    if (body instanceof Response) return body;

    const userId = auth.user?.uid;
    const parsed = insertClubMeetingsSchema.safeParse({
      ...body,
      createdBy: userId,
    });

    if (!parsed.success) {
      return badRequest("잘못된 요청 데이터");
    }

    const newMeeting = storage.createMeeting(parsed.data);
    return created(newMeeting);
  } catch (error) {
    console.error("[POST /api/meetings] failed", error);
    return serverError("모임 생성 실패");
  }
}
