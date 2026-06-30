# Tactile World — tib-preview

DotPad 촉각 콘텐츠 플랫폼 (TIB) 웹 저장소.

- 배포: GitHub `tib-preview` 업로드 → Vercel 자동 배포 (`index.html`)
- DB: Supabase (프로젝트 `nqgaqzpbhmezkrrlbbhm`)

## 먼저 읽을 것
- 전체 구조·작업 방식·보안 모델: **`docs/ARCHITECTURE.md`**
- 배포본 만드는 법: **`build/README.md`**

## 빠른 메모
- `vendor/` = React 번들 (그대로 둠). `src/` = 우리가 직접 만든 소스 (여기만 고침).
- 기능 수정 → `src/` 고치고 → `python3 build/combine.py` → 루트 `index.html` 업로드.
- DB 변경 이력은 `sql/` 폴더(001~)에 순서대로.
