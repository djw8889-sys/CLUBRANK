import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Invalid or expired token") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "권한이 없습니다.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "리소스를 찾을 수 없습니다.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "서버 오류") {
  return NextResponse.json({ error: message }, { status: 500 });
}
