# [PRD] 오답클린 (OdapClean) - High School Math Workbook
Version: 260208_0009

## 1. 제품 개요 (Product Overview)
**오답클린**은 고등학생들이 수학 오답을 효율적으로 관리하고, 사고 과정을 기록하며, 체계적인 복습을 통해 실력을 향상시키는 **지능형 오답 관리 솔루션**입니다.

## 2. 핵심 목표 (Goals)
1. **입력 최적화**: 사진 촬영 및 크롭(Dual Crop)을 통해 오답 등록 시간을 30초 이내로 단축.
2. **사고력 훈련**: 힌트 입력을 통해 자기 주도적 복습 유도.
3. **효율적 복습**: 오답 노트(틀린 문제), 미풀이 문제 등 조건별 필터링을 통한 맞춤형 학습.
4. **체계적 관리**: 문제집(Folder)과 수학 과정(Curriculum)의 이원화된 구조로 체계적인 분류.

## 3. 유저 스토리 (User Stories)
- **학습자**: "문제와 해설을 각각 찍어서 한 번에 저장하고 싶다."
- **학습자**: "특정 문제집(폴더)의 문제만 모아서 풀고 싶다."
- **학습자**: "수학1 > 지수함수 단원의 문제만 골라서 풀고 싶다."
- **학습자**: "틀렸던 문제만 다시 모아서 풀고(오답 노트), 내가 맞았는지 틀렸는지 직접 채점하고 싶다."

## 4. 기능 요구사항 (Functional Requirements)

### 4.1. 오답 등록 (Problem Creation)
- **Dual Crop**: 문제 이미지와 해설 이미지를 각각 업로드 및 크롭하여 저장. (Square/Free aspect ratio 지원)
- **Classification**:
  - **Folder (문제집)**: 사용자가 생성/관리하는 문제집 개념 (예: 쎈, 정석).
  - **Curriculum (수학 과정)**: 수학 교과 과정 계층 구조 (예: 수학(상) > 다항식).
- **Hints**: 단계별 힌트 입력 기능.

### 4.2. 문제 풀이 (Problem Solving)
- **Filtering (문제 풀이 설정)**:
  - **범위**: 전체 또는 특정 폴더/단원 선택.
  - **대상**: 모든 문제, 오답 노트(틀린 문제), 미풀이 문제(새로운 문제).
- **Session Mode**: 선택된 문제들을 연속으로 풀이 (Queue 방식).
- **Process**:
  1. 문제 확인 및 풀이 작성(텍스트/이미지).
  2. **정답 확인**: 해설 이미지 노출.
  3. **자가 채점(Self-Grading)**: 사용자가 "맞음/틀림" 판단 후 기록.
  4. 다음 문제 자동 이동.

### 4.3. 데이터 관리
- **Folder Management**: 폴더 생성, 수정, 삭제.
- **Curriculum Management**: 기본 교과 과정 데이터 제공 및 관리.

### 4.4. 표준 수학 과정 (Curriculum Standard)
- **2022 개정 교육과정**을 기준으로 데이터 제공.
- **구조**:
  - **Level 1 (과목)**: 대수 (고등) 등.
  - **Level 2 (단원)**: 지수함수와 로그함수, 삼각함수 등.
  - **Level 3 (소단원/주제)**: 지수, 로그, 지수함수, 로그함수 등.

## 5. 데이터 설계 (Data Design)

### 5.1. ERD (Entity Relationship Diagram)
- **User**: `id`, `username`, `email`, `created_at`
- **Folder (문제집)**: `id`, `name`, `created_at`
- **Curriculum (수학 과정)**: `id`, `name`, `parent_id` (계층형), `created_at`
- **Problem**: 
  - `id`, `title`, `content`
  - `image_url` (문제), `answer_image_url` (해설)
  - `folder_id` (FK), `curriculum_id` (FK)
  - `created_at`
- **Hint**: `id`, `problem_id`, `content`, `created_at`
- **SolveLog**: 
  - `id`, `problem_id`, `user_id`
  - `solution` (풀이 내용)
  - `is_correct` (자가 채점 결과)
  - `created_at`

## 6. 화면 흐름 (UI Flow)
1. **Main (Dashboard)**: 최근 폴더, 풀이 현황 요약.
2. **Add Problem**:
   - 이미지 선택/촬영 -> 크롭(문제/해설) -> 폴더 및 과정 선택 -> 힌트 입력 -> 저장.
3. **Solve Setup**:
   - 폴더/과정 필터 선택 -> 풀이 대상(오답/미풀이) 선택 -> "시작".
4. **Solve Session**:
   - 문제 풀이 -> 정답 확인 -> 채점(O/X) -> 다음 문제.
