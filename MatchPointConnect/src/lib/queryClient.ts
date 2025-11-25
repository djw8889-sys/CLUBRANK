// client/src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// ✅ 공통 API 요청 함수
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown,
): Promise<Response> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const idToken = user ? await user.getIdToken() : undefined;

    const headers: Record<string, string> = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    };

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Network error: Unable to connect to ${API_BASE || "(relative API)"}. Please check your connection.`,
      );
    }
    throw error;
  }
}

// ✅ React Query 전용 fetch 함수
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const auth = getAuth();
    const user = auth.currentUser;
    const idToken = user ? await user.getIdToken() : undefined;

    const headers: Record<string, string> = {
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    };

    const url = String(queryKey[0]);
    const res = await fetch(url.startsWith("http") ? url : `${API_BASE}${url}`, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
