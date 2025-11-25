import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { badRequest, created, serverError } from "@/lib/server/respond";
import { parseJsonBody } from "@/lib/server/parse-body";
import { storage } from "@/lib/storage";
import { insertClubDuesSchema } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const body = await parseJsonBody<Record<string, any>>(request);
    if (body instanceof Response) return body;

    const parsed = insertClubDuesSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("잘못된 요청 데이터");
    }

    const newDues = storage.createDues(parsed.data);
    return created(newDues);
  } catch (error) {
    console.error("[POST /api/dues] failed", error);
    return serverError("회비 생성 실패");
  }
}
