# Online Journal Club

랩 구성원이 읽은 논문을 정리하고 함께 보는 웹사이트입니다.

이 문서는 **코딩 경험이 없는 사람이 이 사이트를 넘겨받아 관리할 수 있도록** 쓰였습니다.
막히는 부분이 있으면 마지막 장(11. AI에게 물어보는 법)을 먼저 읽으세요.

---

## 1. 이 사이트가 하는 일

| 기능 | 설명 |
|---|---|
| 논문 정리글 작성 | 서식(볼드, 목록, 윗/아랫첨자)을 지원하는 에디터 |
| 논문 정보 자동 입력 | 제목만 검색하면 PubMed에서 저널·저자·DOI를 가져옴 |
| 인용수 조회 | DOI를 기준으로 OpenAlex에서 인용 횟수를 가져옴 |
| Figure 크롭 | PDF를 열어 그림 영역을 잘라 본문에 넣음 |
| 열람·검색 | 대시보드, 키워드 검색, 저널·연도 필터 |
| 통계·랭킹 | 저널별 편수, 월간 다독왕 |
| 개인 페이지 | 내 글·초안 관리, 다른 사람 프로필 보기 |

**권한 규칙**
- 글 **읽기**는 로그인 없이 누구나 가능 (교수님이나 외부인에게 링크 공유 가능)
- 글 **쓰기**는 로그인 필요, 가입은 **초대 코드**를 아는 사람만
- 작성 중인 초안(draft)은 **본인에게만** 보임

---

## 2. 사용 중인 서비스

이 사이트는 네 개의 무료 서비스 위에서 돌아갑니다. 각각 별도 계정이 필요합니다.

| 서비스 | 역할 | 주소 |
|---|---|---|
| **GitHub** | 코드 보관 | github.com |
| **Vercel** | 사이트를 인터넷에 띄움 | vercel.com |
| **Supabase** | 데이터베이스 + 로그인 관리 | supabase.com |
| **Cloudflare R2** | 잘라낸 figure 이미지 저장 | dash.cloudflare.com |

> **인수인계 시 반드시 할 것**
> 네 서비스 모두에서 새 관리자를 **멤버로 초대**하세요. 계정을 통째로 넘기는 것보다 안전하고,
> 나중에 문제가 생겨도 이전 관리자가 도와줄 수 있습니다.
> - GitHub: 조직(Organization) → People → Invite member
> - Supabase: 조직 → Team → Invite
> - Cloudflare: Manage Account → Members → Invite
> - Vercel: 무료 플랜은 팀원 초대 기능이 없음. 새 관리자가 자기 Vercel 계정으로
>   같은 GitHub 저장소를 다시 연결하면 됨 (5장 참고)

---

## 3. 사이트는 이미 켜져 있습니다

**중요:** 이 사이트는 Vercel 서버에서 24시간 돌아갑니다.
관리자가 컴퓨터를 켜둘 필요가 전혀 없습니다.

컴퓨터에서 하는 작업은 **코드를 고칠 때만** 필요합니다.

```
[내 컴퓨터] --git push--> [GitHub] --자동--> [Vercel] --> [방문자]
```

---

## 4. 코드를 고치고 싶을 때

### 4-1. 처음 한 번만 (새 컴퓨터 세팅)

1. **프로그램 설치**
   - [Node.js](https://nodejs.org) — LTS 버전 다운로드 후 설치
   - [Git](https://git-scm.com) — 기본값으로 설치
   - [VS Code](https://code.visualstudio.com) — 코드를 편집하는 프로그램
   - 설치 후 **VS Code를 완전히 껐다 켜야** 인식됩니다

2. **터미널 여는 법**
   VS Code 상단 메뉴 → Terminal → New Terminal
   (화면 아래에 나타나는 검은 입력창이 터미널입니다)

3. **코드 내려받기**
   ```
   git clone https://github.com/gcelku-lab/online-journal.git
   cd online-journal
   npm install
   ```

4. **본인 정보 등록** (컴퓨터마다 한 번씩)
   ```
   git config --global user.name "이름"
   git config --global user.email "GitHub가입이메일"
   ```

5. **`.env.local` 파일 만들기** — 6장 참고. 이게 없으면 사이트가 안 돌아갑니다.

### 4-2. 매번 작업할 때

**시작할 때**
```
git pull          최신 코드 받아오기
npm install       (가끔 새 라이브러리가 추가됐을 수 있음)
npm run dev       미리보기 서버 켜기
```
→ 브라우저에서 `localhost:3000` 접속. **이 화면은 내 컴퓨터에서만 보입니다.**

**끝낼 때**
```
git add .
git commit -m "무엇을 바꿨는지 한 줄로"
git push
```
→ 1~2분 후 실제 사이트에 자동 반영됩니다.

> **철칙: 시작은 `git pull`, 끝은 `git push`**
> `git push`를 안 하면 실제 사이트는 바뀌지 않습니다.
> 다른 컴퓨터에서 이어서 작업할 때도 그 내용이 안 보입니다.

> **배포 전에 확인:** `npm run build`를 실행해서 에러가 없는지 먼저 보세요.
> 여기서 통과하면 배포도 대체로 성공합니다.

---

## 5. 환경변수 (`.env.local`)

API 키 같은 비밀값을 담는 파일입니다. **GitHub에는 절대 올라가지 않습니다**(의도적).
그래서 새 컴퓨터에서는 매번 손으로 다시 만들어야 합니다.

프로젝트 최상위 폴더(`app`, `components` 폴더와 같은 위치)에 `.env.local` 파일을 만들고:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(Supabase 키)
R2_ACCOUNT_ID=(Cloudflare 계정 ID)
R2_ACCESS_KEY_ID=(R2 액세스 키)
R2_SECRET_ACCESS_KEY=(R2 시크릿 키)
R2_BUCKET_NAME=journal-club-figures
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

**각 값을 어디서 찾는가**

| 변수 | 위치 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_*` | Supabase 대시보드 → Project Settings → API Keys |
| `R2_ACCOUNT_ID` | Cloudflare 대시보드 R2 화면 우측 |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Cloudflare → R2 → Manage R2 API Tokens → Create API Token<br>**시크릿은 발급 화면에서만 보이고 다시 못 봅니다. 즉시 저장하세요.** |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Cloudflare → R2 → 버킷 → Settings → Public Development URL |

**주의할 점 (실제로 겪었던 실수들)**
- 값에 따옴표를 씌우지 마세요
- 값 앞뒤에 공백이 들어가지 않게 하세요
- 설명 문구를 값 자리에 넣지 마세요 (예전에 API 키 자리에 안내문이 들어가서 몇 시간 헤맸습니다)
- 주소 끝에 슬래시(`/`)를 붙이지 마세요
- **`.env.local`을 고친 뒤에는 반드시 `npm run dev`를 껐다 켜세요.** 안 그러면 반영되지 않습니다

**Vercel에도 같은 값이 등록되어 있어야 합니다.**
Vercel 대시보드 → 프로젝트 → Settings → Environment Variables.
여기 값을 바꾸면 재배포해야 적용됩니다.

---

## 6. 폴더 구조

```
online-journal/
├── app/                    ← 각 페이지 (폴더 이름 = 주소)
│   ├── page.tsx                 홈 (/)
│   ├── layout.tsx               모든 페이지 공통 껍데기 (헤더가 여기 들어감)
│   ├── globals.css              전체 디자인 (색, 글꼴, 목록 스타일)
│   ├── login/, signup/          로그인·회원가입
│   ├── posts/
│   │   ├── page.tsx             대시보드 (/posts)
│   │   └── [id]/
│   │       ├── page.tsx         글 보기 (/posts/글ID)
│   │       └── edit/page.tsx    글 편집 (/posts/글ID/edit)
│   ├── search/, stats/, ranking/, mypage/, users/
│   └── api/                ← 서버에서 도는 기능들
│       ├── pubmed-search/       PubMed 논문 검색
│       ├── citation/            OpenAlex 인용수 조회
│       └── upload-figure/       잘라낸 이미지를 R2로 업로드
│
├── components/             ← 여러 페이지가 함께 쓰는 화면 조각
│   ├── SiteHeader.tsx           상단 메뉴
│   ├── PostEditor.tsx           글 편집 화면 전체
│   ├── RichEditor.tsx           본문 에디터 (TipTap)
│   ├── PubmedSearchBox.tsx      논문 검색창
│   ├── PdfViewer.tsx            PDF 뷰어
│   ├── FigureCropper.tsx        Figure 잘라내기 화면
│   ├── PostContent.tsx          글 보기에서 본문 렌더링
│   ├── PostList.tsx             글 목록
│   ├── PostFilters.tsx          정렬·필터 UI
│   └── ...
│
├── lib/
│   ├── supabase/                DB 연결 설정
│   └── posts/                   데이터 조회 로직
│       ├── query.ts             글 목록 조회 + 필터 (여러 페이지가 공유)
│       ├── ranking.ts           월간 다독왕 계산
│       ├── stats.ts             저널별 통계
│       └── profile.ts           개인 프로필 요약
│
├── .github/workflows/
│   └── keepalive.yml            Supabase 자동 정지 방지 (9장)
│
└── .env.local                   비밀값 (GitHub에 안 올라감)
```

**규칙 하나:** `app/` 안의 폴더 이름이 곧 주소입니다.
`app/stats/page.tsx` → `사이트주소/stats`

---

## 7. 데이터베이스 구조

Supabase 대시보드 → Table Editor에서 직접 볼 수 있습니다.

| 테이블 | 내용 |
|---|---|
| `profiles` | 사용자의 표시 이름. 이메일·비밀번호는 Supabase가 별도로 안전하게 관리 |
| `posts` | 게시물. 제목, 본문(HTML), 저널, DOI, 저자, 인용수, 상태(draft/published) |
| `figures` | 잘라낸 figure. **DOI + 라벨** 기준으로 저장되어, 같은 논문이면 재사용됨 |
| `invite_codes` | 회원가입용 초대 코드 |

**중요: 자동으로 도는 규칙들(트리거)**
- 회원가입 시 → `profiles`에 이름이 자동 생성됨
- 회원가입 시 → 초대 코드가 맞는지 자동 검사, 틀리면 가입 자체가 취소됨
- 글 수정 시 → `updated_at`이 자동 갱신됨
- 글이 처음 게시될 때 → `published_at`이 기록됨 (월간 랭킹의 기준)

**보안 규칙(RLS)**
Supabase에는 "누가 무엇을 볼 수 있는가"가 데이터베이스 수준에서 설정되어 있습니다.
예를 들어 남의 초안은 코드로 막은 게 아니라 **데이터베이스가 아예 내주지 않습니다.**
Table Editor에서 각 테이블의 "RLS policies"를 눌러 확인할 수 있습니다.

> **경고:** `posts` 테이블에 대해 `drop table` 같은 명령을 절대 실행하지 마세요.
> 모든 글이 사라지고 되돌릴 수 없습니다.
> 구조를 바꿔야 할 때는 `alter table`을 씁니다.

---

## 8. 자주 하게 되는 관리 작업

### 초대 코드 바꾸기
Supabase → SQL Editor에서:
```sql
update public.invite_codes set active = false where code = '기존코드';
insert into public.invite_codes (code) values ('새코드');
```
(기존 코드를 지우지 않고 비활성화하는 이유는 기록을 남기기 위해서입니다.)

### 현재 유효한 코드 확인
```sql
select code, active from public.invite_codes;
```

### 특정 사용자 삭제
Supabase → Authentication → Users에서 삭제.
그 사람의 글도 함께 사라집니다.

### 글 강제 삭제
각자 마이페이지에서 본인 글을 삭제할 수 있습니다.
관리자가 강제로 지워야 하면 Table Editor에서 `posts` 행을 삭제하세요.

---

## 9. 정기적으로 확인할 것

### Supabase 자동 정지 (가장 중요)
Supabase 무료 플랜은 **7일간 아무 활동이 없으면 프로젝트를 정지**시킵니다.
정지되면 사이트가 완전히 멈춥니다.

이를 막기 위해 GitHub Actions가 **매일 자동으로 신호를 보냅니다**
(`.github/workflows/keepalive.yml`).

**확인 방법:** GitHub 저장소 → Actions 탭 → "Supabase Keepalive"
최근 실행 기록에 초록색 체크가 있으면 정상입니다.

> **함정:** GitHub는 저장소에 **60일간 커밋이 없으면** 이 자동 실행을 꺼버립니다.
> 오랫동안 코드를 안 고쳤다면 Actions 탭에서 "Enable workflow" 버튼을 눌러 다시 켜세요.
> 방학이나 학회 시즌처럼 조용한 시기에 사이트가 죽는 원인이 대개 이것입니다.

### 저장 용량
| 서비스 | 무료 한도 | 확인 위치 |
|---|---|---|
| Supabase | 데이터베이스 500MB | 대시보드 → Settings → Usage |
| Cloudflare R2 | 스토리지 10GB, 전송량 무제한 | R2 → 버킷 |

글 수백 개 수준에서는 여유가 충분합니다. 1년에 한 번 정도 확인하면 됩니다.

### 정지 예고 메일
Supabase에서 정지 예고 메일이 오면, **메일에 적힌 프로젝트 ID**를 확인하세요.
`.env.local`의 주소에 들어있는 ID와 다르면 안 쓰는 다른 프로젝트 얘기이므로 무시해도 됩니다.

---

## 10. 문제가 생겼을 때

### 사이트가 안 열린다
1. Vercel 대시보드 → Deployments → 최근 배포가 **Error**인지 확인
2. Supabase 대시보드 → 프로젝트가 **Paused** 상태인지 확인 (9장 참고)
   → Paused면 대시보드에서 "Restore" 버튼으로 복구

### 코드를 고쳤는데 사이트에 반영이 안 된다
- `git push`를 했는지 확인
- Vercel Deployments에서 Building이 끝났는지 확인 (1~2분 소요)
- 브라우저에서 `Ctrl + Shift + R`로 강제 새로고침

### 뭔가 이상하게 동작한다
**브라우저에서 F12를 눌러 Console 탭을 보세요.** 빨간 글씨가 원인을 알려줍니다.
그 내용을 그대로 복사해서 AI에게 물어보면 대부분 해결됩니다.

### 배포를 되돌리고 싶다
Vercel → Deployments → 잘 작동하던 이전 배포 → "Promote to Production"

---

## 11. AI에게 물어보는 법

이 사이트는 AI(Claude 등)의 도움으로 만들어졌고, 유지보수도 같은 방식으로 할 수 있습니다.
**코딩을 몰라도 됩니다. 대신 질문을 잘 해야 합니다.**

### 대화를 시작할 때 붙여넣을 기본 정보

```
랩실 논문 정리 사이트를 유지보수하려고 해. 나는 코딩 경험이 거의 없어.

기술 스택:
- Next.js (App Router) + TypeScript
- Supabase (데이터베이스 + 로그인)
- Cloudflare R2 (이미지 저장)
- Vercel 배포
- TipTap (본문 에디터)
- PDF.js (figure 크롭)

지금 하려는 것: (여기에 목적을 씁니다)
```

### 좋은 질문 vs 나쁜 질문

| 나쁜 예 | 좋은 예 |
|---|---|
| "사이트가 안 돼요" | "글 보기 화면에서 이미지가 안 뜹니다. 브라우저 Console에 이런 에러가 나옵니다: (에러 전문 붙여넣기)" |
| "검색 기능 고쳐줘" | "`/search`에서 키워드를 넣어도 결과가 안 나옵니다. `lib/posts/query.ts` 파일 내용을 붙여넣을 테니 봐주세요" |
| "버튼 추가해줘" | "마이페이지에 '전체 내보내기' 버튼을 추가하고 싶습니다. `app/mypage/page.tsx` 파일은 이렇습니다: (내용)" |

### 반드시 함께 전달할 것

1. **에러 메시지 전문** — 요약하지 말고 그대로 복사
   - 브라우저: F12 → Console 탭
   - 터미널: `npm run dev`가 돌고 있는 창의 빨간 글씨
2. **관련 파일 내용** — 6장의 폴더 구조를 보고 해당 파일을 통째로 복사
3. **스크린샷** — 화면이 이상하면 캡처가 가장 빠릅니다

### AI에게 요청할 때 유용한 문장

- "**파일 전체를 다시 줘.** 어디를 고칠지 찾기 어려워." → 부분 수정보다 실수가 적습니다
- "**어느 파일의 몇 번째 줄인지 정확히 알려줘.**"
- "이 코드가 **무슨 일을 하는지 설명해줘.** 코딩을 몰라."
- "**Supabase 호출에는 에러 확인 코드를 꼭 넣어줘.**" → 문제가 조용히 숨는 걸 막습니다

### 실제로 자주 겪었던 함정들

이 프로젝트를 만들면서 반복적으로 발생했던 문제입니다. 비슷한 증상이면 먼저 의심하세요.

| 증상 | 원인 |
|---|---|
| 뭘 해도 결과가 안 나옴 | **환경변수 오타**. 값 자리에 설명 문구가 들어갔거나, 이름을 잘못 씀 |
| `.env.local`을 고쳤는데 그대로임 | **서버 재시작 안 함**. `Ctrl+C` 후 `npm run dev` |
| "저장했다"는데 데이터가 없음 | **DB 컬럼이 없음**. 에러 확인 코드를 넣으면 바로 드러납니다 |
| `Module not found` | **파일 이름/폴더 오타** (`client.ts`를 `clinent.ts`로 쓰는 등) |
| 화면 색이 이상함 | 브라우저가 다크 모드. `globals.css`에서 관리 |
| 외부 API가 계속 빈 결과 | **응답 상태 코드를 확인하세요.** 조용히 거부당하고 있을 수 있습니다 |

> **디버깅의 핵심 원칙:**
> "왜 안 되지?"를 추측하지 말고, **에러 메시지를 직접 눈으로 보세요.**
> 코드에 `console.log`를 넣어 실제 값을 찍어보는 것이 가장 빠른 해결책입니다.

---

## 12. SQL 스크립트 보관

데이터베이스 구조를 만든 SQL 명령들은 Supabase 대시보드의 SQL Editor에
번호순으로 저장되어 있습니다 (`01_profiles_setup` ~ `09_...`).

**이것들은 웹 대시보드에만 존재합니다.** 프로젝트를 새로 만들거나 이전해야 할 때를 대비해,
`supabase/sql/` 폴더에 파일로도 백업해두는 것을 권장합니다.

---

## 13. 아직 안 만든 것

향후 추가할 수 있는 기능들입니다.

- **태그 시스템** — 논문에 주제 태그를 달고 태그로 검색. 통제된 태그 목록을 미리 정해두고
  사용자는 그 안에서 고르게 하는 방식을 권장 (자유 입력은 `Treg`/`Tregs`/`regulatory T cell`처럼
  같은 뜻의 태그가 난립합니다)
- **Highlights 자동 생성** — 글 상단 요약. 작성 폼에 고정 항목
  (핵심 질문 / 주요 발견 / 방법의 특징 / 한계)을 두는 템플릿 방식이 간단하고 품질도 좋습니다
- **교신저자 통계** — PubMed API가 교신저자를 제공하지 않아 보류.
  마지막 저자를 대리 지표로 쓰거나 작성자가 직접 입력하는 방식이 필요합니다
