import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/server/auth";
import { storage } from "@/lib/storage";
import { created, serverError } from "@/lib/server/respond";
import { parseJsonBody } from "@/lib/server/parse-body";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.response) return auth.response;

    const body = await parseJsonBody<{
      name?: string;
      region?: string;
      description?: string;
      logoUrl?: string;
      bannerUrl?: string;
      primaryColor?: string;
    }>(request);
    if (body instanceof Response) return body;

    const userId = auth.user?.uid;
    const { name, region, description, logoUrl, bannerUrl, primaryColor } = body;

    if (!name) {
      return Response.json({ error: "클럽 이름은 필수입니다." }, { status: 400 });
    }

    const newClub = storage.createClub({
      name,
      region,
      description,
      logoUrl,
      bannerUrl,
      primaryColor,
      owner: userId,
      members: [userId],
    });

    return created(newClub);
  } catch (error) {
    console.error("[POST /api/clubs] failed", error);
    return serverError("클럽 생성 실패");
  }
}
