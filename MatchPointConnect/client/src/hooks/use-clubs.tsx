import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

/**
 * 🔥 Codespaces 서버 URL 자동 계산 (정확한 버전)
 * - 프론트: https://<prefix>-5173.app.github.dev
 * - 서버:   https://<prefix>-5000.app.github.dev
 */
function getServerBaseUrl() {
  const origin = window.location.origin;

  if (origin.includes(".app.github.dev")) {
    // 1) 도메인 분리 → ['https://improved-enigma-xxx', '5173.app.github.dev']
    const parts = origin.split("-");
    // 2) 마지막 조각 제거 (5173)
    parts.pop();
    // 3) 5000 붙여서 서버 prefix 재구성
    const serverPrefix = parts.join("-");
    return `${serverPrefix}-5000.app.github.dev`;
  }

  // 로컬 환경 fallback
  return "http://localhost:5000";
}

const BASE_URL = getServerBaseUrl();

/**
 * 내 클럽 멤버십 조회
 */
export function useMyClubMembership() {
  const { token, user } = useAuth();

  const normalizeMembership = (data: any) => {
    if (!data) return [] as {
      membership: { clubId: string; userId: string; role: string; isActive: boolean };
      club: any;
    }[];

    const items = Array.isArray(data) ? data : [data];

    return items
      .map((item) => {
        if (!item) return null;

        const membershipData = item.membership ?? item;
        const clubData = item.club ?? membershipData?.club ?? null;

        return {
          membership: {
            clubId: membershipData?.clubId ?? clubData?.id ?? "",
            userId: membershipData?.userId ?? "",
            role: membershipData?.role ?? "",
            isActive: membershipData?.isActive ?? true,
          },
          club: clubData,
        };
      })
      .filter(Boolean);
  };

  const query = useQuery({
    queryKey: ["my-club-membership", user?.uid],
    enabled: !!token && !!user,
    queryFn: async () => {
      if (!token) throw new Error("Firebase 인증 토큰이 없습니다.");

      const url = `${BASE_URL}/api/clubs/my-membership`;
      console.log("🔥 [CLIENT] Fetching my-membership:", url);

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ [CLIENT] Error:", res.status, errorText);
        throw new Error(`클럽 정보를 불러올 수 없습니다. ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log("🔥 [CLIENT] RAW membership:", data);

      return normalizeMembership(data);
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    data: query.data || [],
    memberships: query.data || [],
    refetch: query.refetch,
  };
}

/**
 * 클럽 멤버 조회
 */
export function useClubMembers(clubId: string | number | undefined) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["club-members", clubId],
    enabled: !!clubId && !!token,
    queryFn: async () => {
      const url = `${BASE_URL}/api/clubs/${clubId}/members`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`멤버 정보를 불러오지 못했습니다. ${res.status} - ${errorText}`);
      }

      return res.json();
    },
  });
}

/**
 * 클럽 탈퇴
 */
export function useLeaveClub() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (clubId: string | number) => {
      const url = `${BASE_URL}/api/clubs/${clubId}/leave`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`클럽 탈퇴에 실패했습니다. ${res.status} - ${errorText}`);
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "클럽 탈퇴 완료",
        description: "클럽에서 성공적으로 탈퇴했습니다.",
      });

      queryClient.invalidateQueries({
        queryKey: ["my-club-membership"],
      });
    },
    onError: () => {
      toast({
        title: "클럽 탈퇴 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });
}
