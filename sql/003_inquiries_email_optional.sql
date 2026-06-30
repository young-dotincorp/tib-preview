-- 챗봇 문의는 이메일이 선택값이므로 email 열의 NOT NULL 제약을 해제
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
ALTER TABLE public.inquiries ALTER COLUMN email DROP NOT NULL;
