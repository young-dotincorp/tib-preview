-- ============================================================
-- [2단계 보정] 챗봇 함수 비회원 실행 '진짜로' 차단
--  • 원인: PostgreSQL은 함수 생성 시 PUBLIC(모두)에게 실행권한을 자동 부여
--          → anon만 회수해선 PUBLIC 자격으로 여전히 실행 가능했음
--  • 조치: PUBLIC + anon 에서 회수하고, authenticated 에게만 명시 부여
--  • 재실행 안전. Supabase 대시보드 → SQL Editor.
--  • [PART 1] 먼저 RUN → [PART 2]만 따로 RUN.
-- ============================================================


-- ===================== [PART 1] 보정 적용 =====================
do $$
declare r record;
begin
  for r in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from   pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where  n.nspname = 'public'
      and  p.proname in ('chat_list','chat_user_post','close_chat','get_inquiry_by_ticket')
  loop
    execute format('revoke execute on function public.%I(%s) from public;',        r.proname, r.args);
    execute format('revoke execute on function public.%I(%s) from anon;',          r.proname, r.args);
    execute format('grant  execute on function public.%I(%s) to authenticated;',   r.proname, r.args);
  end loop;
end $$;
-- =================== [PART 1] 끝 (여기까지 RUN) ===================



-- ===================== [PART 2] 확인용 =======================
-- 위 PART 1 RUN 뒤, 아래 SELECT만 드래그해서 따로 RUN 하세요.
select p.proname                                                          as 함수,
       case when has_function_privilege('anon', p.oid, 'execute')
            then 'anon=허용 ⚠️' else 'anon=차단 ✅' end                    as 비회원,
       case when has_function_privilege('authenticated', p.oid, 'execute')
            then 'authenticated=허용 ✅' else 'authenticated=차단 ⚠️' end  as 로그인사용자
from   pg_proc p join pg_namespace n on n.oid = p.pronamespace
where  n.nspname = 'public'
  and  p.proname in ('chat_list','chat_user_post','close_chat','get_inquiry_by_ticket')
order  by p.proname;
-- 기대 결과: 4개 함수 모두  비회원=차단 ✅ / 로그인사용자=허용 ✅
