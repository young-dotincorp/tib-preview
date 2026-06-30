# Tactile World — 구조 설명서 (ARCHITECTURE)

이 문서는 "무엇이 어디에 있고, 왜 그런지, 어떻게 바꾸는지"를 적어둔 지도입니다.
개발자가 아니어도 읽을 수 있게 썼어요.

---

## 1. 한눈에 보기

Tactile World는 세 층으로 이뤄져 있습니다.

- **DB (Supabase) = 두뇌.** 로그인·문의·작품·리뷰·권한이 모두 여기 있습니다.
  웹이든 앱이든 이 두뇌에 연결만 하면 됩니다. (가장 값진 영구 자산)
- **vendor 번들 = React 앱 본체.** 이미 잘 도는 빌드 결과물(약 4.96MB)입니다.
  원본 소스(`TIB.jsx`)가 오기 전까지는 **그대로 두고** 손대지 않습니다.
- **src = 우리가 직접 만든 소스.** 챗봇처럼 우리가 손으로 쓴 코드입니다.
  앞으로 기능 수정은 여기 작은 파일만 고칩니다. (번들을 뒤지지 않음)

배포본(`index.html`)은 `vendor 번들`에 `src/chatbot`을 끼워 넣어 만든 결과물이고,
GitHub(`tib-preview`)에 올리면 Vercel이 자동 배포합니다.

---

## 2. 폴더 지도

```
tactile-world-repo/
├─ index.html                 배포본 (Vercel이 서빙) — combine.py가 생성
├─ admin.html                 배포본 (관리자 화면) — combine.py가 생성
│
├─ vendor/                    React 번들 (그대로 둠, 원본 오면 교체)
│  ├─ tib-bundle.html         index 용 — 챗봇 자리에 마커만 있음
│  └─ admin-bundle.html       admin 용 — 챗봇 자리에 마커만 있음
│
├─ src/                       우리가 만든 소스 (여기만 고침)
│  ├─ chatbot/                오른쪽 아래 상담 챗봇
│  │  ├─ chatbot.css          챗봇 스타일
│  │  ├─ chatbot.html         챗봇 마크업 (런처 버튼 + 패널)
│  │  └─ chatbot.js           챗봇 동작 (로그인 게이트 + 토큰 인증 포함)
│  └─ chat-modal/             답변 모달 + 실시간 채팅 모달
│     ├─ chat-modal.css       공유 스타일 (.twr-)
│     ├─ reply.js             답변 모달 (__TW_REPLY__)
│     └─ chat.js              실시간 채팅 모달 (__TW_CHAT__)
│
├─ sql/                       DB 변경 이력 (순서대로, 재실행 안전)
│  ├─ 001_chat_multiturn.sql
│  ├─ 002_close_chat_idempotent.sql
│  ├─ 003_inquiries_email_optional.sql
│  ├─ 004_inquiries_select_fix.sql      (보안: 문의 노출 차단)
│  ├─ 005_db_write_lock.sql             (보안: 리뷰/챗봇 로그인 필수)
│  ├─ 006_lock_chat_rpc_from_public.sql (보안: 챗봇 함수 비회원 차단)
│  └─ diagnostics/
│     └─ rls_audit_readonly.sql         읽기 전용 권한 점검 쿼리
│
├─ build/
│  ├─ combine.py              vendor + src/chatbot → index/admin 생성
│  └─ README.md               합치는 방법
│
└─ docs/
   └─ ARCHITECTURE.md         이 문서
```

---

## 3. 챗봇을 바꾸고 싶을 때 (작업 방식)

1. `src/chatbot/` 안의 파일(주로 `chatbot.js`)만 고칩니다. 4.96MB 번들은 건드리지 않습니다.
2. `python3 build/combine.py` 를 돌리면 `index.html` · `admin.html`이 새로 만들어집니다.
   (combine은 `vendor/` 번들의 마커 두 곳에 `src/chatbot`과 `src/chat-modal`을 끼워 넣습니다.)
   - 비개발자는 직접 돌릴 필요 없어요. 세션에서 Claude가 합쳐 배포본을 만들어 드립니다.
3. 만들어진 `index.html`(필요 시 `admin.html`)을 GitHub `tib-preview`에 업로드 → Vercel 자동 배포.

이 방식의 핵심: **고치는 범위가 작고 분명**해졌습니다. 더 이상 거대한 번들을
문자열로 찾아 바꾸지 않습니다(= 번들 패치 빚이 멈춤).

> 무손실 보장: `combine.py`로 다시 만든 배포본은 지금 운영 중인 파일과
> **byte 단위로 동일**함이 검증되었습니다. 즉 분리 작업으로 깨진 것이 전혀 없습니다.

---

## 4. 보안 모델 요약 (DB에 영구 적용됨)

쓰기·콘텐츠 액션의 기준 — "남에게 보이거나 / 책임·소유가 필요하거나 / 내 계정에
쌓여야 의미 있으면 → 로그인 필수".

| 액션 | 비회원 | 근거 |
|---|---|---|
| 작품 둘러보기·검색·상세, 리뷰 읽기, 변환 스튜디오 | 가능 | 공개 열람 |
| 일반 연락처(문의) 보내기 | 가능 (주인 없음으로만) | 접근성 창구, 위조·열람 불가 |
| 리뷰 작성 | 로그인 필수 | 남에게 보임·책임 |
| 챗봇 상담 | 로그인 필수 | 이력 관리·스팸 방지 |
| 작품 업로드 · 신고 | 로그인 필수 | 소유·책임 |

- 잠금은 항상 **DB(RLS)에서 먼저** 걸려 있습니다. 화면(게이트)은 그 위의 안내일 뿐입니다.
- 챗봇 함수(`chat_list`/`chat_user_post`/`close_chat`/`get_inquiry_by_ticket`)는
  **비회원(anon) 실행 차단**, 로그인 사용자(authenticated)만 허용.
- 문의(inquiries)·리뷰(feedback)는 본인 글만 수정·삭제, 비공개 작품은 외부 열람 불가.

자세한 변경 이력은 `sql/` 폴더(001~006)에 순서대로 있습니다.

---

## 5. vendor 안에 아직 남아 있는 것 (다음에 정리)

지금은 챗봇과 채팅/답변 모달을 소스로 떼어냈습니다. 번들 안에는 아직
React 앱 본체가 남아 있고, 원본 확보 시 정식 빌드로 전환할 수 있습니다.

- React 앱 본체 — 원본 `TIB.jsx`가 확보되면 정식 빌드 파이프라인으로 전환  ← 다음 큰 과제
- (필요 시) 그 밖의 작은 위젯이 더 있으면 같은 방식으로 분리

원본 `TIB.jsx`가 오면: `vendor/`의 번들만 새 빌드로 교체하면 됩니다.
우리가 만든 `src/` 소스는 그대로 살아 있어, 버리는 것이 하나도 없습니다.

---

## 6. 앱으로 확장할 때 (대표님 요청 대비)

- **DB(Supabase)는 그대로 재사용**합니다. 앱을 만들어도 두뇌는 다시 만들지 않습니다.
- 화면에서 "무엇을 보여줄지(내용·규칙)"와 "어떻게 보여줄지(웹 화면)"를 분리해 둘수록,
  앱은 "어떻게 보여줄지"만 새로 입히면 됩니다. 챗봇 분리가 그 분리의 첫걸음입니다.
- 결과적으로 웹 상용화 작업이 곧 앱의 토대를 미리 쌓는 일이 됩니다.

---

## 7. 진행 이력

- 1단계 (보안 점검): 코드 안전성 확인 + 문의 노출 구멍 차단(004).
- 2단계 (DB 잠금): 리뷰·챗봇 로그인 필수, 연락처는 안전하게 열어둠(005·006).
- 첫 구조화: 챗봇을 번들에서 무손실 분리 → `src/chatbot/` 소스화, `combine.py` 빌드 도입.
- 두 번째 구조화: 답변·실시간 채팅 모달을 무손실 분리 → `src/chat-modal/` 소스화.
- 채팅 모달 인증 복구: DB 잠금(006) 이후 채팅 모달(`chat.js`)도 로그인 토큰으로 호출하도록 수정.
- 실시간 준비: `chat_messages` 소유자 범위 SELECT 정책 + Realtime publication 등록(007).

*다음 후보: 채팅 실시간 구독(폴링→즉시 반영) JS 연결, Dot Games TTS 통일, 원본 `TIB.jsx` 확보 시 정식 빌드 전환 등.*
