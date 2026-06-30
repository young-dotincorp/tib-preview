-- ─────────────────────────────────────────────────────────────
-- [1단계 보안점검] RLS 현황 통합 진단 — 읽기 전용 (DB 변경 없음)
-- ★ 이 쿼리는 '한 덩어리'라서 RUN 한 번이면 결과가 한 표에 다 나옵니다.
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 RUN → 결과 표 전체를 복사해 주세요.
-- ─────────────────────────────────────────────────────────────

-- (A) RLS 켜짐 여부
select  '1_RLS켜짐'                          as section,
        c.relname                            as table_name,
        case when c.relrowsecurity then 'RLS ON ✅' else 'RLS OFF ⚠️' end as item,
        ''                                   as detail
from    pg_class c
join    pg_namespace n on n.oid = c.relnamespace
where   n.nspname = 'public'
  and   c.relname in ('graphics','feedback','reports','inquiries','chat_messages','app_admins')

union all

-- (B) 각 테이블의 RLS 정책 (없으면 이 섹션에 행이 안 나옴 = 정책 없음 신호)
select  '2_정책'                              as section,
        p.tablename                          as table_name,
        p.policyname || ' [' || p.cmd || ']' as item,
        'roles=' || array_to_string(p.roles, ',') ||
        ' | using=' || coalesce(p.qual, '-') ||
        ' | check=' || coalesce(p.with_check, '-') as detail
from    pg_policies p
where   p.schemaname = 'public'
  and   p.tablename in ('graphics','feedback','reports','inquiries','chat_messages','app_admins')

union all

-- (C) anon/authenticated 직접 권한(GRANT)
select  '3_권한'                              as section,
        g.table_name                         as table_name,
        g.grantee                            as item,
        string_agg(g.privilege_type, ', ' order by g.privilege_type) as detail
from    information_schema.role_table_grants g
where   g.table_schema = 'public'
  and   g.grantee in ('anon','authenticated')
  and   g.table_name in ('graphics','feedback','reports','inquiries','chat_messages','app_admins')
group by g.table_name, g.grantee

order by section, table_name, item;
-- 끝. 결과 표 전체를 복사해 주세요.
