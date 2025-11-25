# Express → Next.js API Route 매핑 (App Router, Node.js Runtime)

## 런타임/스토리지/DB 운영 방침
- **모든 Next.js API Route는 Node.js Runtime 고정**: `export const runtime = 'nodejs'`를 각 핸들러에 명시하여 Firebase Admin, Drizzle 연결이 Edge에 배치되지 않도록 합니다.
- **Drizzle + 서버리스**: 데이터베이스 커넥션은 **싱글톤/전역 캐시** 패턴으로 재사용하여 요청마다 새 커넥션을 만들지 않습니다.
- **storage.ts 유지**: 1차 마이그레이션에서는 기존 `server/storage.ts` 기반 메모리 스토리지를 `src/lib/storage.ts`로 옮겨 **동일 동작**을 유지합니다. Drizzle로의 완전 이전은 추후 별도 단계에서 진행합니다.

## 1) Express → Next.js API 경로 매핑표
| 기존 Express 경로 | 메서드 | 새 Next.js 경로 (`app/api` 기준) | 응답 형식/상태코드 변경 여부 |
| --- | --- | --- | --- |
| /api/users/:userId/memberships | GET | app/api/users/[userId]/memberships/route.ts | 동일 유지 |
| /api/clubs/my-membership | GET | app/api/clubs/my-membership/route.ts | 동일 유지 |
| /api/clubs/:id | GET | app/api/clubs/[id]/route.ts | 동일 유지 |
| /api/clubs/:id/members | GET | app/api/clubs/[id]/members/route.ts | 동일 유지 |
| /api/clubs/:id/leave | POST | app/api/clubs/[id]/leave/route.ts | 동일 유지 |
| /api/clubs | POST | app/api/clubs/route.ts | 동일 유지 |
| /api/users/online | GET | app/api/users/online/route.ts | 동일 유지 |
| /api/users/:userId | GET | app/api/users/[userId]/route.ts | 동일 유지 |
| /api/clubs/:clubId/rankings/user/:userId | GET | app/api/clubs/[clubId]/rankings/user/[userId]/route.ts | 동일 유지 |
| /api/clubs/:clubId/rankings/:gameFormat | GET | app/api/clubs/[clubId]/rankings/[gameFormat]/route.ts | 동일 유지 |
| /api/clubs/:clubId/user/:userId/stats | GET | app/api/clubs/[clubId]/user/[userId]/stats/route.ts | 동일 유지 |
| /api/clubs/:clubId/user/:userId/partnerships | GET | app/api/clubs/[clubId]/user/[userId]/partnerships/route.ts | 동일 유지 |
| /api/clubs/matches/:matchId/complete | POST | app/api/clubs/matches/[matchId]/complete/route.ts | 동일 유지 |
| /api/clubs/:clubId/meetings | GET | app/api/clubs/[clubId]/meetings/route.ts | 동일 유지 |
| /api/clubs/:clubId/meetings | POST | app/api/clubs/[clubId]/meetings/route.ts | 동일 유지 |
| /api/meetings/:meetingId | GET | app/api/meetings/detail/[meetingId]/route.ts | 경로만 변경(응답 동일) |
| /api/meetings/:meetingId | PUT | app/api/meetings/detail/[meetingId]/route.ts | 경로만 변경(응답 동일) |
| /api/meetings/:meetingId | DELETE | app/api/meetings/detail/[meetingId]/route.ts | 경로만 변경(응답 동일) |
| /api/meetings/:meetingId/join | POST | app/api/meetings/detail/[meetingId]/join/route.ts | 경로만 변경(응답 동일) |
| /api/meetings/:meetingId/leave | POST | app/api/meetings/detail/[meetingId]/leave/route.ts | 경로만 변경(응답 동일) |
| /api/dues/:clubId | GET | app/api/dues/[clubId]/route.ts | 동일 유지 |
| /api/dues | POST | app/api/dues/route.ts | 동일 유지 |
| /api/dues/:id | PATCH | app/api/dues/[id]/route.ts | 동일 유지 |
| /api/dues/:id | DELETE | app/api/dues/[id]/route.ts | 동일 유지 |
| /api/attendance/:clubId | GET | app/api/attendance/[clubId]/route.ts | 동일 유지 |
| /api/attendance | POST | app/api/attendance/route.ts | 동일 유지 |
| /api/attendance/:id | PATCH | app/api/attendance/[id]/route.ts | 동일 유지 |
| /api/attendance/:id | DELETE | app/api/attendance/[id]/route.ts | 동일 유지 |
| /api/meetings/:clubId (클럽 모임 목록, club-admin.ts) | GET | app/api/meetings/list/[clubId]/route.ts | 경로만 변경(응답 동일) |
| /api/meetings/detail/:id | GET | app/api/meetings/detail/[id]/route.ts | 동일 유지 |
| /api/meetings | POST | app/api/meetings/route.ts | 동일 유지 |
| /api/meetings/:id/join | POST | app/api/meetings/[id]/join/route.ts | 동일 유지 |
| /api/meetings/:id/leave | POST | app/api/meetings/[id]/leave/route.ts | 동일 유지 |
| /api/meetings/:id | PATCH | app/api/meetings/[id]/route.ts | 동일 유지 |
| /api/meetings/:id | DELETE | app/api/meetings/[id]/route.ts | 동일 유지 |

> 경로 충돌 방지: Express의 `/api/meetings/:meetingId`(상세)와 `/api/meetings/:clubId`(목록) 충돌을 피하기 위해 Next.js에서는 `detail/[meetingId]`, `list/[clubId]` 세그먼트를 사용합니다. 응답 구조는 동일하게 유지합니다.

## 2) 응답 구조 상세 (Express 기준 유지)
- **공통 에러**: 인증 누락/실패 `401 { error: "..." }`; 존재하지 않는 리소스 `404 { error: "..." }`; 검증 실패 `400 { error: "...", details?: zodError }`; 서버 오류 `500 { error: "..." }`.

### 멤버십/클럽
- `GET /api/users/:userId/memberships` / `GET /api/clubs/my-membership`
  - 성공: `[{ membership: { clubId, userId, isActive, role, joinedAt }, club: { ... } }]`
  - 실패: 403(타인 조회) `{ error: "권한이 없습니다." }`, 401(인증 누락), 500 `{ error: "멤버십 조회 실패" }`
- `GET /api/clubs/:id`
  - 성공: `{ id, name, description, members, owner?, region?, logoUrl?, bannerUrl?, primaryColor? }`
  - 실패: 404 `{ error: "클럽을 찾을 수 없습니다." }`
- `GET /api/clubs/:id/members`
  - 성공: `[{ id, userId, clubId, role, joinedAt, isActive }]`
  - 실패: 404 `{ error: "클럽을 찾을 수 없습니다." }`
- `POST /api/clubs/:id/leave`
  - 성공: `{ success: true }`
  - 실패: 500 `{ error: "클럽 탈퇴 실패" }`
- `POST /api/clubs`
  - 성공: `201` + 생성된 클럽 객체(`{ id?, name, region, description, logoUrl, bannerUrl, primaryColor, owner, members }`)
  - 실패: 400 `{ error: "클럽 이름은 필수입니다." }`, 500 `{ error: "클럽 생성 실패" }`

### 사용자
- `GET /api/users/online`
  - 성공: `{ users: [{ id, username, photoURL, ntrp, region, mannerScore, wins, losses, points, bio, tier, age, availableTimes, isOnline: true, lastChanged? }], count, message }`
  - 실패: 401 `{ error: "인증 정보가 없습니다." }`, 500 `{ error: "서버 오류가 발생했습니다." }`
- `GET /api/users/:userId`
  - 성공: `{ profile: { id, username, photoURL, ntrp, region, mannerScore, wins, losses, points, bio, tier }, isOwnProfile, message }`
  - 실패: 400 `{ error: "userId가 필요합니다." }`, 404 `{ error: "사용자를 찾을 수 없습니다." }`/`{ error: "사용자 데이터가 없습니다." }`, 500 `{ error: "서버 오류가 발생했습니다." }`

### 랭킹/전적
- `GET /api/clubs/:clubId/rankings/user/:userId`
  - 성공: `{ rankings: [...] }` (랭킹 포인트 배열)
  - 실패: 400 `{ error: "Invalid club ID" }`, 500 `{ error: "랭킹 정보를 가져올 수 없습니다." }`
- `GET /api/clubs/:clubId/rankings/:gameFormat`
  - 성공: `{ rankings: [...] }` (gameFormat별 포인트 배열)
  - 실패: 400 `{ error: "Invalid club ID" }` 또는 `{ error: "Invalid game format" }`, 500 `{ error: "클럽 랭킹을 가져올 수 없습니다." }`
- `GET /api/clubs/:clubId/user/:userId/stats`
  - 성공: `{ matchHistory: [...], statsByFormat: { [gameFormat]: { rankingPoints, wins, losses, draws, gamesPlayed, winRate } }, totalMatches }`
  - 실패: 400 `{ error: "Invalid club ID" }`, 500 `{ error: "사용자 통계를 가져올 수 없습니다." }`
- `GET /api/clubs/:clubId/user/:userId/partnerships`
  - 성공: `{ partnerships: [{ partnerId, wins, losses, draws, gamesPlayed, winRate }] }`
  - 실패: 400 `{ error: "Invalid club ID" }`, 500 `{ error: "파트너십 분석을 가져올 수 없습니다." }`
- `POST /api/clubs/matches/:matchId/complete`
  - 성공: `{ message: "Match completion endpoint active" }`
  - 실패: 500 `{ error: "경기 완료 처리 중 오류가 발생했습니다." }`

### 모임(클럽 경로)
- `GET /api/clubs/:clubId/meetings`
  - 성공: `[{ id, clubId, owner?, title?, description?, location?, startTime?, endTime?, maxParticipants?, participants: string[], createdAt, updatedAt }]`
  - 실패: 500 `{ error: "모임 조회 실패" }`
- `POST /api/clubs/:clubId/meetings`
  - 성공: `201` + 생성된 모임 객체(위 필드 + 요청 본문 필드)
  - 실패: 500 `{ error: "모임 생성 실패" }`

### 모임(공용 경로, detail/list로 분리)
- `GET /api/meetings/list/:clubId`
  - 성공: `[{ ...meeting }]` (클럽 모임 목록)
  - 실패: 500 `{ error: "모임 조회 실패" }`
- `GET /api/meetings/detail/:meetingId`
  - 성공: `{ ...meeting }`
  - 실패: 404 `{ error: "모임을 찾을 수 없습니다." }`, 500 `{ error: "모임 조회 실패" }`
- `PUT /api/meetings/detail/:meetingId`
  - 성공: `{ ...updatedMeeting }`
  - 실패: 500 `{ error: "모임 업데이트 실패" }`
- `DELETE /api/meetings/detail/:meetingId`
  - 성공: `{ success: true }`
  - 실패: 500 `{ error: "모임 삭제 실패" }`
- `POST /api/meetings/detail/:meetingId/join`
  - 성공: `{ ...updatedMeeting }`
  - 실패: 400 `{ error: "참가할 수 없습니다." }`, 500 `{ error: "모임 참가 실패" }`
- `POST /api/meetings/detail/:meetingId/leave`
  - 성공: `{ ...updatedMeeting }`
  - 실패: 500 `{ error: "모임 취소 실패" }`

### 모임(관리 라우트: 기존 club-admin.ts)
- `GET /api/meetings/list/:clubId`
  - 성공: `[{ ...meeting }]`
  - 실패: 500 `{ error: "모임 조회 실패" }`
- `GET /api/meetings/detail/:id`
  - 성공: `{ ...meeting }`
  - 실패: 404 `{ error: "모임을 찾을 수 없습니다." }`, 500 `{ error: "모임 조회 실패" }`
- `POST /api/meetings`
  - 성공: `201` + 생성된 모임 객체(입력값 + `createdBy`/타임스탬프 포함)
  - 실패: 400 `{ error: "잘못된 요청 데이터", details }`, 500 `{ error: "모임 생성 실패" }`
- `POST /api/meetings/:id/join`
  - 성공: `{ ...updatedMeeting }`
  - 실패: 400 `{ error: "모임 참가 실패 (정원 초과 또는 이미 참가)" }`, 500 `{ error: "모임 참가 실패" }`
- `POST /api/meetings/:id/leave`
  - 성공: `{ ...updatedMeeting }`
  - 실패: 404 `{ error: "모임을 찾을 수 없습니다." }`, 500 `{ error: "모임 참가 취소 실패" }`
- `PATCH /api/meetings/:id`
  - 성공: `{ ...updatedMeeting }`
  - 실패: 404 `{ error: "모임을 찾을 수 없습니다." }`, 500 `{ error: "모임 업데이트 실패" }`
- `DELETE /api/meetings/:id`
  - 성공: `{ success: true }`
  - 실패: 404 `{ error: "모임을 찾을 수 없습니다." }`, 500 `{ error: "모임 삭제 실패" }`

### 회비(Dues)
- `GET /api/dues/:clubId`
  - 성공: `[{ id, clubId, userId?, amount?, status?, dueDate?, paidAt?, createdAt, updatedAt, ... }]`
  - 실패: 500 `{ error: "회비 조회 실패" }`
- `POST /api/dues`
  - 성공: `201` + `{ ...dues, id, createdAt, updatedAt }`
  - 실패: 400 `{ error: "잘못된 요청 데이터", details }`, 500 `{ error: "회비 생성 실패" }`
- `PATCH /api/dues/:id`
  - 성공: `{ ...updatedDues }`
  - 실패: 404 `{ error: "회비를 찾을 수 없습니다." }`, 500 `{ error: "회비 업데이트 실패" }`
- `DELETE /api/dues/:id`
  - 성공: `{ success: true }`
  - 실패: 404 `{ error: "회비를 찾을 수 없습니다." }`, 500 `{ error: "회비 삭제 실패" }`

### 출석(Attendance)
- `GET /api/attendance/:clubId`
  - 성공: `[{ id, clubId, userId?, eventDate?, status?, notes?, createdAt, updatedAt }]`
  - 실패: 500 `{ error: "출석 조회 실패" }`
- `POST /api/attendance`
  - 성공: `201` + `{ ...attendance, id, createdAt, updatedAt }`
  - 실패: 400 `{ error: "잘못된 요청 데이터", details }`, 500 `{ error: "출석 생성 실패" }`
- `PATCH /api/attendance/:id`
  - 성공: `{ ...updatedAttendance }`
  - 실패: 404 `{ error: "출석 기록을 찾을 수 없습니다." }`, 500 `{ error: "출석 업데이트 실패" }`
- `DELETE /api/attendance/:id`
  - 성공: `{ success: true }`
  - 실패: 404 `{ error: "출석 기록을 찾을 수 없습니다." }`, 500 `{ error: "출석 삭제 실패" }`

## 3) 추가 구현 메모
- 모든 API에서 Firebase ID 토큰은 `Authorization: Bearer <idToken>` 헤더로 전달하고, 검증 실패 시 401을 반환합니다.
- 클라이언트는 기존 응답 JSON을 그대로 받을 수 있도록 구조와 필드를 유지합니다.
- Next.js 마이그레이션 시 Drizzle 연결/스토리지 초기화는 `src/lib`의 서버 전용 모듈에서 싱글톤으로 노출하고, 각 API Route에서 가져다 씁니다.
