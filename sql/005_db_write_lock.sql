-- ============================================================
-- [2단계] DB 잠금 — 쓰기 권한을 '데이터 차원'에서 확정
--  방침: 챗봇 상담·리뷰 = 로그인 필수
--        일반 연락처   = 비회원 허용 (단 user_id=null '주인 없음'으로만)
--        → 어느 경우도 남의 명의 위조·남의 글 열람은 불가
--
--  ★ 선행조건: 먼저 1단계(새 index.html=챗봇 게이트)를 배포하고
--    챗봇이 잘 막히는 걸 확인한 뒤에 이 SQL을 실행하세요.
--    (옛 챗봇이 떠 있는 상태에서 실행하면 챗봇이 잠깐 멈춰요)
--
--  ※ 재실행 안전. Supabase 대시보드 → SQL Editor 에 붙여넣고 RUN.
--  ※ 아래 [PART 1]을 먼저 RUN → 그다음 [PART 2]만 따로 RUN.
-- ============================================================


-- ===================== [PART 1] 잠금 적용 =====================

-- ── (1) 문의(inquiries) INSERT 정리 ──────────────────────────
-- 비회원은 '주인 없음(null)'으로만, 회원은 '본인'으로만 넣도록 통일.
drop policy if exists "anyone can submit inquiry" on public.inquiries;  -- check=true(위조 가능) 제거
drop policy if exists "inquiries_auth_insert"    on public.inquiries;   -- check=true(위조 가능) 제거
-- 남길 정책: inquiries_insert_any = public, check((user_id IS NULL) OR (auth.uid()=user_id))
-- 혹시 없으면 만들어 두기(있으면 그대로 둠):
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname='public' and tablename='inquiries'
                   and policyname='inquiries_insert_any') then
    create policy "inquiries_insert_any" on public.inquiries
      for insert to public
      with check ((user_id is null) or (auth.uid() = user_id));
  end if;
end $$;

-- ── (2) 리뷰(feedback) INSERT 잠금 — 로그인 본인만 ───────────
-- 리뷰 작성 화면은 이미 로그인 필수라 화면은 안 깨짐. DB도 본인만 허용.
drop policy if exists "create feedback"      on public.feedback;  -- 비회원 작성 제거
drop policy if exists "feedback_auth_insert" on public.feedback;  -- check=true → 본인강제로 교체
create policy "feedback_insert_own_authed" on public.feedback
  for insert to authenticated
  with check (user_id = auth.uid());
-- (리뷰 공개읽기 / 본인 수정·삭제 / 관리자 읽기 정책은 건드리지 않고 그대로 유지)

-- ── (3) 챗봇 함수(RPC) — 비회원 실행 차단 ────────────────────
-- 챗봇 상담은 로그인 필수. 로그인 사용자(authenticated)는 그대로 동작.
do $$
declare r record;
begin
  for r in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from   pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where  n.nspname = 'public'
      and  p.proname in ('chat_list','chat_user_post','close_chat','get_inquiry_by_ticket')
  loop
    execute format('revoke execute on function public.%I(%s) from anon;', r.proname, r.args);
  end loop;
end $$;
-- (admin_chat_post=관리자전용, claim_chat=로그인전용 은 그대로 둠)

-- =================== [PART 1] 끝 (여기까지 RUN) ===================



-- ===================== [PART 2] 확인용 =======================
-- 위 PART 1을 RUN 한 뒤, 아래 SELECT만 드래그해서 따로 RUN 하세요.
-- 한 표로 결과가 나옵니다. 그대로 복사해 주시면 같이 확인할게요.

select '문의/리뷰 INSERT 정책' as 구분,
       tablename               as 대상,
       policyname              as 항목,
       array_to_string(roles, ',') || ' | check=' || coalesce(with_check, '-') as 내용
from   pg_policies
where  schemaname = 'public'
  and  tablename in ('inquiries','feedback')
  and  cmd = 'INSERT'

union all

select '챗봇함수 비회원실행',
       p.proname,
       case when has_function_privilege('anon', p.oid, 'execute')
            then 'anon=허용 ⚠️' else 'anon=차단 ✅' end,
       case when has_function_privilege('authenticated', p.oid, 'execute')
            then 'authenticated=허용' else 'authenticated=차단 ⚠️' end
from   pg_proc p join pg_namespace n on n.oid = p.pronamespace
where  n.nspname = 'public'
  and  p.proname in ('chat_list','chat_user_post','close_chat','get_inquiry_by_ticket')

order by 1, 2, 3;

-- 기대 결과:
--  inquiries → inquiries_insert_any 한 줄 (public, null 또는 본인)
--  feedback  → feedback_insert_own_authed 한 줄 (authenticated, user_id=auth.uid())
--  챗봇함수 4개 → 모두 anon=차단 ✅, authenticated=허용
