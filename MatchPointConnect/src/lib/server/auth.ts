import { NextRequest } from "next/server";
import { unauthorized } from "./respond";
import { verifyFirebaseToken } from "./firebase-admin";

export type AuthenticatedUser = {
  uid: string;
  email?: string;
  [key: string]: any;
};

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return { response: unauthorized("Missing Authorization header") };
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return { response: unauthorized("Invalid Authorization header format") };
  }

  try {
    const decoded = (await verifyFirebaseToken(token)) as AuthenticatedUser;
    return { user: decoded };
  } catch (error: any) {
    console.error("Authentication failed", error);
    return { response: unauthorized("Invalid or expired token") };
  }
}
