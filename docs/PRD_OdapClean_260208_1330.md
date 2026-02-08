# [PRD] 오답클린 (OdapClean) - High School Math Workbook
Version: 260208_1330

## 1. 제품 개요 (Product Overview)
**오답클린**은 고등학생들이 수학 오답을 효율적으로 관리하고, 사고 과정을 기록하며, 체계적인 복습을 통해 실력을 향상시키는 **지능형 오답 관리 솔루션**입니다.

## 2. 핵심 목표 (Goals)
1. **입력 최적화**: 사진 촬영 및 크롭(Dual Crop)을 통해 오답 등록 시간을 30초 이내로 단축.
2. **사고력 훈련**: 힌트 입력을 통해 자기 주도적 복습 유도.
3. **효율적 복습**: 학습 세션(Study Session)을 통해 맞춤형 문제 풀이 환경 제공 및 반복 학습 지원.
4. **체계적 관리**: 문제집(Folder)과 수학 과정(Curriculum)의 이원화된 구조로 체계적인 분류.
5. **보안 및 개인화**: 사용자별 데이터 격리 및 인증을 통한 개인화된 학습 경험 제공.

## 3. 유저 스토리 (User Stories)
- **학습자**: "문제와 해설을 각각 찍어서 한 번에 저장하고 싶다."
- **학습자**: "특정 문제집(폴더)의 문제만 모아서 풀고 싶다."
- **학습자**: "시험 기간을 대비해 '2025 1학기 중간고사'라는 세션을 만들고, 특정 범위의 문제만 반복해서 풀고 싶다."
- **학습자**: "문제를 풀 때 타이머로 시간을 재고, 힌트를 단계별로 확인하며 풀고 싶다."
- **학습자**: "로그인하여 내 오답 노트만 안전하게 관리하고 싶다."

## 4. 기능 요구사항 (Functional Requirements)

### 4.1. 인증 및 사용자 관리 (Authentication)
- **로그인/회원가입**: 이메일/비밀번호 기반 계정 생성 및 JWT 인증.
- **데이터 격리**: 수학 과정(Curriculum)을 제외한 모든 데이터(문제, 폴더, 세션, 풀이 기록)는 사용자별로 격리.

### 4.2. 데이터 관리 (Data Management)
- **CRUD UI**: 각 관리 단위(Folder, Problem, Curriculum)에 대해 리스트, 추가, 조회, 검색, 수정, 삭제가 가능한 메뉴 기반 UI 제공.
- **검색**: 폴더명, 문제 제목/내용, 커리큘럼명 등으로 실시간 검색 지원.

### 4.3. 오답 등록 (Problem Creation)
- **Dual Crop**: 문제 이미지와 해설 이미지를 각각 업로드 및 크롭하여 저장.
- **Classification**:
  - **Folder (문제집)**: 사용자가 생성/관리하는 문제집.
  - **Curriculum (수학 과정)**: 수학 교과 과정 계층 구조.
- **Hints**: 단계별 힌트 입력 기능.

### 4.4. 학습 세션 (Study Session)
- **세션 생성**:
  - 세션명 지정 (예: "2025 1학기 중간고사 대비").
  - **다중 선택**: 복수의 커리큘럼 및 폴더를 포함 가능.
  - **복습 모드**: 전체(All) / 틀린 문제(Wrong Only) / 미풀이(Not Attempted) / 랜덤(Random) 설정.
- **설정 저장**: 세션 설정값(범위, 모드 등)은 DB에 저장되어 언제든 재사용 및 수정 가능.

### 4.5. 문제 풀이 (Problem Solving)
- **환경**:
  - **Timer**: 문제 풀이 시간 측정 (시작/일시정지/종료).
  - **Hints**: 단계별 힌트 열람 기능 (열람 시 기록).
- **Process**:
  1. 문제 및 타이머 시작.
  2. 필요 시 힌트 확인.
  3. 풀이 작성 및 정답 확인(해설 이미지).
  4. **채점 (Grading)**: 답안 비교를 통한 확인 또는 사용자가 직접 맞음/틀림 여부를 선택하여 등록하는 자가 채점 모두 지원.
  5. 풀이 시간 및 결과 저장.

## 5. 데이터 설계 (Data Design)

### 5.1. 데이터베이스 설계 원칙 (Design Rules)
- **Primary Key**: 모든 테이블의 PK는 `테이블명_id` 형식을 따른다 (예: `user_id`, `folder_id`).
- **Audit Columns**: 모든 테이블에 생성/수정 추적을 위한 컬럼을 포함한다.
  - `created_at`: 생성 일시
  - `updated_at`: 수정 일시
  - `created_by`: 생성자 ID
  - `updated_by`: 수정자 ID

### 5.2. ERD (Schema Definition)

#### 1. Users (사용자)
- `user_id` (PK)
- `username`
- `email`
- `hashed_password`
- `created_at`, `updated_at`

#### 2. Folders (문제집)
- `folder_id` (PK)
- `user_id` (FK)
- `name`
- `created_at`, `updated_at`, `created_by`, `updated_by`

#### 3. Curriculums (수학 과정 - 공용)
- `curriculum_id` (PK)
- `name`
- `parent_id` (FK, Self-referencing)
- `level` (Depth)
- `sort_order`
- `created_at`, `updated_at`, `created_by`, `updated_by`

#### 4. Problems (문제)
- `problem_id` (PK)
- `user_id` (FK)
- `folder_id` (FK)
- `curriculum_id` (FK)
- `title`
- `content`
- `image_url`, `answer_image_url`
- `created_at`, `updated_at`, `created_by`, `updated_by`

#### 5. Hints (힌트)
- `hint_id` (PK)
- `problem_id` (FK)
- `content`
- `step_number`
- `created_at`, `updated_at`

#### 6. SolveLogs (풀이 기록)
- `solve_log_id` (PK)
- `user_id` (FK)
- `problem_id` (FK)
- `solution`
- `is_correct`
- `time_spent` (초 단위)
- `created_at`

#### 7. StudySessions (학습 세션)
- `study_session_id` (PK)
- `user_id` (FK)
- `name`
- `mode` ('all', 'wrong', 'not_attempted', 'random')
- `created_at`, `updated_at`, `created_by`, `updated_by`

#### 8. StudySessionCurriculums (세션-커리큘럼 N:M)
- `session_id` (FK)
- `curriculum_id` (FK)

#### 9. StudySessionFolders (세션-폴더 N:M)
- `session_id` (FK)
- `folder_id` (FK)

## 6. 화면 흐름 (UI Flow)
1. **Login**: 이메일/비밀번호 입력 -> 토큰 발급.
2. **Layout**: 좌측 사이드바 메뉴 (Dashboard, My Sessions, Problem Bank, Folders, Curriculums).
3. **Dashboard**: 전체 현황 요약.
4. **My Sessions**:
   - 세션 목록 조회.
   - 새 세션 생성 (이름, 모드, 커리큘럼/폴더 다중 선택).
   - 세션 진입 -> 문제 풀이 화면(타이머, 힌트 포함).
5. **Management Pages (Problems, Folders, Curriculums)**:
   - 검색 바, 리스트, 추가/수정 폼(모달 또는 토글), 삭제 버튼.
