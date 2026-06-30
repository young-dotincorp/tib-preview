-- ============================================================
-- [007] 실시간 채팅 준비 + chat_messages 읽기 범위 강화
--  (1) 보안 강화: 로그인 사용자는 '자기 상담'의 메시지만 직접 읽기 가능
--                 (관리자는 전체). 비회원 직접 읽기 불가. RPC 경로는 그대로.
--  (2) 실시간 켜기: chat_messages 변경을 즉시 받도록 Realtime publication 등록.
--  성격: '추가만(additive)' — 기존 동작·폴링·RPC 모두 그대로. 안전·재실행 안전.
--  Supabase 대시보드 → SQL Editor.  [PART 1] 먼저 RUN → [PART 2] 따로 RUN.
-- ============================================================


-- ===================== [PART 1] 적용 =====================

-- (1) 소유자 범위 SELECT 정책 (없을 때만 생성)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='chat_messages'
      and policyname='chat_messages_owner_read'
  ) then
    create policy "chat_messages_owner_read" on public.chat_messages
      for select to authenticated
      using (
        exists (select 1 from public.inquiries i
                 where i.ticket = chat_messages.conversation
                   and i.user_id = auth.uid())
        or exists (select 1 from public.app_admins a
                    where a.user_id = auth.uid())
      );
  end if;
end $$;

-- (2) Realtime publication 에 chat_messages 추가 (publication 존재 + 미등록일 때만)
do $$
begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='chat_messages'
     ) then
    execute 'alter publication supabase_realtime add table public.chat_messages';
  end if;
end $$;

-- =================== [PART 1] 끝 (여기까지 RUN) ===================



-- ===================== [PART 2] 확인용 =====================
-- 위 PART 1 RUN 뒤, 아래 SELECT만 드래그해서 따로 RUN 하세요. (한 표로 나옵니다)

select '읽기 정책' as 구분,
       policyname as 항목,
       array_to_string(roles, ',') || ' | ' || coalesce(qual, '-') as 내용
from   pg_policies
where  schemaname='public' and tablename='chat_messages' and cmd='SELECT'

union all

select 'Realtime 등록',
       tablename,
       'publication=supabase_realtime ✅'
from   pg_publication_tables
where  pubname='supabase_realtime' and schemaname='public' and tablename='chat_messages';

-- 기대 결과:
--  읽기 정책   → chat_messages_owner_read (authenticated, 내 상담 또는 관리자) 1줄
--  Realtime 등록 → chat_messages 1줄
