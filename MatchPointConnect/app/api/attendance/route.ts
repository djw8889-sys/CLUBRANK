import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { badRequest, created, serverError } from "@/lib/server/respond";
import { parseJsonBody } from "@/lib/server/parse-body";
import { storage } from "@/lib/storage";
import { insertClubAttendanceSchema } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const body = await parseJsonBody<Record<string, any>>(request);
    if (body instanceof Response) return body;

    const parsed = insertClubAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("잘못된 요청 데이터");
    }

    const newAttendance = storage.createAttendance(parsed.data);
    return created(newAttendance);
  } catch (error) {
    console.error("[POST /api/attendance] failed", error);
    return serverError("출석 생성 실패");
  }
}
