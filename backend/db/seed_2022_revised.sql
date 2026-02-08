-- 2022 개정 교육과정 데이터 시드

-- 대수 (고등)
INSERT INTO curriculums (name, level, sort_order) VALUES ('대수 (고등)', 1, 10);

DO $$
DECLARE
    subject_id BIGINT;
    unit_id BIGINT;
BEGIN
    -- Subject: 대수 (고등)
    SELECT curriculum_id INTO subject_id FROM curriculums WHERE name = '대수 (고등)' AND level = 1 LIMIT 1;

    -- Unit 1: 지수함수와 로그함수
    INSERT INTO curriculums (name, parent_id, level, sort_order) VALUES ('지수함수와 로그함수', subject_id, 2, 1) RETURNING curriculum_id INTO unit_id;
    INSERT INTO curriculums (name, parent_id, level, sort_order) VALUES ('지수', unit_id, 3, 1);
    INSERT INTO curriculums (name, parent_id, level, sort_order) VALUES ('로그', unit_id, 3, 2);
    INSERT INTO curriculums (name, parent_id, level, sort_order) VALUES ('지수함수', unit_id, 3, 3);
    INSERT INTO curriculums (name, parent_id, level, sort_order) VALUES ('로그함수', unit_id, 3, 4);

    -- Unit 2: 삼각함수
    INSERT INTO curriculums (name, parent_id, level, sort_order) VALUES ('삼각함수', subject_id, 2, 2) RETURNING curriculum_id INTO unit_id;
    INSERT INTO curriculums (name, parent_id, level, sort_order) VALUES ('일반각과 호도법', unit_id, 3, 1);
    INSERT INTO curriculums (name, parent_id, level, sort_order) VALUES ('삼각함수', unit_id, 3, 2);
    INSERT INTO curriculums (name, parent_id, level, sort_order) VALUES ('삼각함수의 그래프', unit_id, 3, 3);
    INSERT INTO curriculums (name, parent_id, level, sort_order) VALUES ('사인법칙과 코사인법칙', unit_id, 3, 4);
    
END $$;
