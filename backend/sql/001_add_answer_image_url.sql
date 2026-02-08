-- problems 테이블에 answer_image_url 컬럼 추가
-- 이 쿼리를 Supabase Dashboard > SQL Editor에서 실행하세요.

ALTER TABLE problems ADD COLUMN IF NOT EXISTS answer_image_url TEXT;

-- (선택사항) 기존 content 컬럼에 임시 저장된 데이터가 있다면 마이그레이션
-- UPDATE problems SET answer_image_url = content WHERE answer_image_url IS NULL AND content IS NOT NULL;
