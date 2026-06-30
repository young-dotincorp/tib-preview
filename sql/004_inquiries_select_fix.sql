-- ─────────────────────────────────────────────────────────────
-- [1단계 보안 보완] inquiries 문의 내용 노출 차단
--  • 문제: inquiries_auth_select (using=true) 때문에
--          로그인 회원 누구나 '모든 사람'의 문의를 읽을 수 있었음
--  • 조치: 이 과도한 정책만 제거
--  • 유지: 본인 문의(inquiries_select_own) + 관리자 전체읽기(admin_read_all)
--          → 마이페이지 '내 문의', 관리자 받은함 모두 영향 없음
--  • 재실행 안전(if exists). Supabase 대시보드 → SQL Editor → RUN
-- ─────────────────────────────────────────────────────────────

drop policy if exists inquiries_auth_select on public.inquiries;


-- ── 확인용: 지금 inquiries에 남은 SELECT 정책이 '본인'과 '관리자'뿐인지 ──
-- (위 DROP 실행 뒤, 아래만 따로 드래그해서 RUN 하면 결과가 보입니다)
select policyname,
       cmd,
       array_to_string(roles, ',') as roles,
       qual                        as using_expr
from   pg_policies
where  schemaname = 'public'
  and  tablename  = 'inquiries'
  and  cmd        = 'SELECT'
order  by policyname;
-- 기대 결과: admin_read_all(관리자), inquiries_select_own(본인) 두 줄만.
--            inquiries_auth_select(using=true)가 사라졌으면 성공.
