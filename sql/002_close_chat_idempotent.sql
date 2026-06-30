-- ─────────────────────────────────────────────────────────────
-- 상담 종료(close_chat) 멱등 처리
--  • 이미 종료된 대화면 "상담이 종료되었어요." 메시지를 다시 넣지 않음
--  • 한쪽(사용자/관리자)이 종료한 뒤 다른 쪽이 또 눌러도 중복 메시지가 안 생김
--  • Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행 (재실행 안전)
-- ─────────────────────────────────────────────────────────────
create or replace function public.close_chat(p_conversation text, p_by text)
returns public.chat_messages
language plpgsql security definer set search_path = public as $$
declare r public.chat_messages; v_done boolean;
begin
  select (status = 'done') into v_done
    from public.inquiries where ticket = p_conversation limit 1;

  if coalesce(v_done, false) then
    -- 이미 종료됨 → 새 메시지 없이 마지막 종료 메시지를 그대로 반환 (멱등)
    select * into r from public.chat_messages
      where conversation = p_conversation and sender = 'system'
      order by id desc limit 1;
    return r;
  end if;

  insert into public.chat_messages(conversation, sender, body)
  values (p_conversation, 'system', '상담이 종료되었어요.') returning * into r;
  update public.inquiries set status = 'done' where ticket = p_conversation;
  return r;
end; $$;

grant execute on function public.close_chat(text, text) to anon, authenticated;
