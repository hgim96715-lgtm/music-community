# Music Community

> 같은 음악만 반복해서 듣다가, 다른 사람들은 어떤 취미를 가지고 어떤 음악을 들을까? 내가 모르는 숨겨진 명곡을 누군가는 듣고 있지 않을까?

**Music Community**는 사용자끼리 노래를 추천하고 받는 소셜 음악 플랫폼입니다.  
기존 스트리밍 앱처럼 "듣기"만 하는 것이 아니라, **추천·반응·대화**를 통해 새로운 음악을 발견하는 경험을 만듭니다.

---

## 기획 배경

맨날 똑같은 플레이리스트만 돌려 듣다 보면 이런 생각이 듭니다.

- 사람들은 어떤 취미를 가지고 있을까?
- 사람들은 어떤 음악을 들을까?
- 내가 모르는 숨겨진 명곡을 누군가는 듣고 있지 않을까?

알고리즘이 아닌 **사람의 취향과 이유**로 음악을 만나는 서비스를 만들고 싶어서 시작했습니다.

---

## 핵심 가치

| 기존 뮤직 앱 | Music Community |
|-------------|-----------------|
| 앨범·플레이리스트·아티스트 중심 탐색 | **사람과 상황** 중심 추천 |
| 알고리즘 피드 | **추천 이유·분위기·반응** 기반 피드 |
| 개인 청취에 집중 | **추천 → 감상 → 반응 → 대화** 루프 |

---

## 주요 기능 (로드맵)

### 1. 오늘의 한곡

- 하루에 **한 곡만** 추천 (스팸 방지 + 진심 어린 추천)
- 추천 시 작성: **추천 이유**, **분위기 태그**, **기타 메모**
- 추천받은 사람: 곡을 듣고 **반응** 남기기 (좋아요, 감상기 등)

### 2. 미리듣기 (Embed)

- Spotify / YouTube / Apple Music embed로 **짧게 맛보기**
- 전체 앱 없이도 곡을 바로 들어볼 수 있음

### 3. 소셜 & 알림

- 추천에 대한 **댓글**
- 반응·댓글 **알림**
- **감상 기록** + **행동 기록** → 개인화된 추천 피드 개선

### 4. 채팅방 (주제별 커뮤니티)

- 사용자가 직접 **방 개설** (예: "락 좋아하는 방", "새벽 감성 방")
- 방 안에서 곡 공유·대화

### 5. 투표

- "이 상황에 어울리는 곡은?" 같은 **커뮤니티 투표**
- 요청형 추천: "운전할 때 많이 듣는 탑 5" 등

### 6. 랜덤 한곡

- **새로운 노래 한곡 받기** 버튼
- 내 취향과 **반대 방향**의 곡을 랜덤 추천 → 안전지대 탈출

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | [Next.js](https://nextjs.org/) + [Tailwind CSS](https://tailwindcss.com/) — UI · `fetch`만 |
| Backend | [NestJS](https://nestjs.com/) — API · Prisma · 인증 · 비즈니스 규칙 |
| DB | **PostgreSQL** (로컬: Docker `docker-compose.yml`) |
| Auth | **Nest JWT** + Bearer (`POST /auth/*`) |
| Realtime | TBD (채팅·알림용) |
| Music API | Spotify / YouTube / Apple Music Embed |

> **아키텍처:** Nest 집중 — Web/앱은 화면 + REST 호출, DB·규칙은 API만. 상세: `apps/docs/overview.md` (로컬)

---

## 프로젝트 구조

```
music-community/
├── package.json          # dev:api · dev:web (루트에서 실행)
├── pnpm-workspace.yaml
├── apps/
│   ├── web/              # Next.js (:3031)
│   ├── api/              # NestJS (:3030)
│   └── docs/             # 설계 문서 (로컬, overview.md부터)
├── docker-compose.yml    # Postgres만 (로컬 :5433)
└── README.md
```

pnpm workspace 모노레포. **Web URL path = API path** (`/recommendations`, `/users/me` …). 네이밍 규칙: `apps/docs/overview.md`

---

## 지금까지

| | |
| --- | --- |
| **라이브 Web** | [music-community-web.vercel.app](https://music-community-web.vercel.app) |
| **라이브 API** | [api-production-4b66.up.railway.app](https://api-production-4b66.up.railway.app) |
| **배포** | Vercel (Web) · Railway (API) · Neon (DB) |

- 피드 · embed · 가입·로그인 · 추천 올리기 · 좋아요 · 본인 글 삭제
- 마이페이지 (`/users/me`) · SavedCard 포토카드 앨범
- Admin — 추천 운영 · 통계 · 사용자 목록 · `lastActiveAt` DAU

로컬 실행·배포 상세 — `apps/docs/` (`changelog.md` · `deploy.md`)

---

## 개발 시작

### 로컬 포트

| 앱 | 포트 | URL |
|----|------|-----|
| API (NestJS) | 3030 | http://localhost:3030 |
| Web (Next.js) | 3031 | http://localhost:3031 |
| Postgres (Docker) | 5433 | `localhost:5433` |

| 파일 | 변수 |
|------|------|
| `apps/api/.env` | `PORT=3030`, `DATABASE_URL` (호스트 **5433**) |
| `apps/web/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:3030` |

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up -d    # DB만
```

### 실행

```bash
pnpm install              # 루트에서 한 번

pnpm dev:api              # 터미널 1 — Nest :3030
pnpm dev:web              # 터미널 2 — Next :3031
```

http://localhost:3031 에서 API health `{"ok":true}` 확인 (1단계).

```bash
# 개별 앱에서 직접 실행해도 됨
cd apps/api && pnpm start:dev
cd apps/web && pnpm dev
```

큰 틀·개발 순서: `apps/docs/overview.md`

---

## 라이선스

TBD

---

## 기여

아직 초기 단계입니다. 이슈·아이디어 환영합니다.
