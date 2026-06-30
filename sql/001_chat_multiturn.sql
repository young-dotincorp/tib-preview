-- =====================================================================
-- B안 멀티턴 채팅 + 상담 상태(미답변/진행중/완료) + 상담 종료
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 RUN 한 번만 실행하세요.
-- 기존 inquiries 테이블/데이터는 건드리지 않습니다. 다시 실행해도 안전.
-- 대화ID = 기존 ticket(8자리 랜덤, 추측 불가) 사용.
-- =====================================================================

-- 1) 대화 메시지 테이블 (sender: user/admin/system)
create table if not exists public.chat_messages (
  id           bigint generated always as identity primary key,
  conversation text        not null,
  sender       text        not null,
  body         text        not null,
  created_at   timestamptz not null default now()
);
create index if not exists chat_messages_conv_idx
  on public.chat_messages (conversation, created_at);
-- sender 허용값(system 포함)으로 정리
alter table public.chat_messages drop constraint if exists chat_messages_sender_check;
alter table public.chat_messages
  add constraint chat_messages_sender_check check (sender in ('user','admin','system'));

alter table public.chat_messages enable row level security;

-- 2) 대화 메시지 조회
create or replace function public.chat_list(p_conversation text)
returns setof public.chat_messages
language sql security definer set search_path = public as $$
  select * from public.chat_messages
  where conversation = p_conversation order by created_at asc;
$$;

-- 3) 방문자 메시지 — sender='user', 보내면 상담 '진행중(open)'으로 (종료됐어도 재개)
create or replace function public.chat_user_post(p_conversation text, p_body text)
returns public.chat_messages
language plpgsql security definer set search_path = public as $$
declare r public.chat_messages;
begin
  if coalesce(btrim(p_body),'') = '' then raise exception 'empty body'; end if;
  insert into public.chat_messages(conversation, sender, body)
  values (p_conversation, 'user', left(p_body, 4000)) returning * into r;
  update public.inquiries set status='open' where ticket = p_conversation;
  return r;
end; $$;

-- 4) 상담사 메시지 — app_admins만, 답변해도 '진행중(open)' (완료 아님!)
create or replace function public.admin_chat_post(p_conversation text, p_body text)
returns public.chat_messages
language plpgsql security definer set search_path = public as $$
declare r public.chat_messages;
begin
  if not exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then
    raise exception 'not authorized'; end if;
  if coalesce(btrim(p_body),'') = '' then raise exception 'empty body'; end if;
  insert into public.chat_messages(conversation, sender, body)
  values (p_conversation, 'admin', left(p_body, 4000)) returning * into r;
  update public.inquiries
     set reply = p_body, replied_at = now(), status = 'open'
   where ticket = p_conversation;
  return r;
end; $$;

-- 5) 상담 종료 — 상담사/사용자 모두 가능. 안내 메시지 + status='done'
create or replace function public.close_chat(p_conversation text, p_by text)
returns public.chat_messages
language plpgsql security definer set search_path = public as $$
declare r public.chat_messages;
begin
  insert into public.chat_messages(conversation, sender, body)
  values (p_conversation, 'system', '상담이 종료되었어요.') returning * into r;
  update public.inquiries set status='done' where ticket = p_conversation;
  return r;
end; $$;

grant execute on function public.chat_list(text)             to anon, authenticated;
grant execute on function public.chat_user_post(text, text)  to anon, authenticated;
grant execute on function public.admin_chat_post(text, text) to authenticated;
grant execute on function public.close_chat(text, text)      to anon, authenticated;


-- 6) 대화 연결(claim) — 로그인 회원이 자기 대화를 계정에 연결 (인증 필수, 안전)
--    아직 주인이 없는(user_id null) 대화만, 인증된 본인 id로 연결.
create or replace function public.claim_chat(p_conversation text)
returns void
language sql security definer set search_path = public as $$
  update public.inquiries
     set user_id = auth.uid()
   where ticket = p_conversation and user_id is null;
$$;
grant execute on function public.claim_chat(text) to authenticated;

-- 끝.
