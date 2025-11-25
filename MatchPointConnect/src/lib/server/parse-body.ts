import { NextRequest } from "next/server";
import { badRequest } from "./respond";

export async function parseJsonBody<T>(request: NextRequest): Promise<T | Response> {
  try {
    return (await request.json()) as T;
  } catch (error) {
    console.error("Failed to parse request body", error);
    return badRequest("Invalid JSON body");
  }
}
