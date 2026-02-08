export interface User {
  user_id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface UserCreate {
  username: string;
  email?: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Folder {
  folder_id: number;
  name: string;
  user_id?: number;
  sort_order: number;
}

export interface Curriculum {
  curriculum_id: number;
  name: string;
  parent_id?: number;
  level: number;
  sort_order: number;
  created_at: string;
}

export interface CurriculumCreate {
  name: string;
  parent_id?: number;
  level: number;
  sort_order: number;
}

export interface Problem {
  problem_id: number;
  user_id?: number;
  folder_id?: number;
  curriculum_id?: number;
  title: string;
  problem_image_url?: string | null;
  answer_image_url?: string | null;
  sort_order: number;
  created_at: string;
  updated_at?: string;
  solve_count: number;
  correct_rate: number;
  latest_status: 'correct' | 'wrong' | 'not_attempted';
}

export interface ProblemCreate {
  title: string;
  folder_id?: number;
  curriculum_id?: number;
  hints: string[];
  problem_image_url?: string | null;
  answer_image_url?: string | null;
}

export interface Hint {
  hint_id: number;
  content: string;
  step_number: number;
  problem_id: number;
  created_at: string;
}

export interface SolveLog {
  solve_log_id: number;
  problem_id: number;
  user_id: number;
  solution: string;
  is_correct: boolean;
  time_spent?: number;
  image_url?: string;
  created_at: string;
}

export interface ProblemWithHints extends Problem {
  hints: Hint[];
}

export interface FolderWithProblems extends Folder {
  problems: Problem[];
}

export interface StudySession {
  study_session_id: number;
  user_id: number;
  name: string;
  mode: 'all' | 'wrong' | 'not_attempted';
  created_at: string;
  updated_at: string;
  curriculum_ids?: number[];
  folder_ids?: number[];
}

export interface StudySessionCreate {
  name: string;
  mode: 'all' | 'wrong' | 'not_attempted';
  curriculum_ids?: number[];
  folder_ids?: number[];
}

export interface FolderStatItem {
  folder_id: number;
  name: string;
  total: number;
  solved: number;
  correct: number;
  correct_rate: number;
}

export interface CurriculumStatItem {
  curriculum_id: number;
  name: string;
  total: number;
  solved: number;
  correct: number;
  correct_rate: number;
}

export interface StatisticsResponse {
  total_problems: number;
  solved_count: number;
  correct_count: number;
  correct_rate: number;
  by_folder: FolderStatItem[];
  by_curriculum: CurriculumStatItem[];
}

export interface FolderReorderItem {
  folder_id: number;
  sort_order: number;
}

export interface CurriculumReorderItem {
  curriculum_id: number;
  sort_order: number;
}

export interface ProblemReorderItem {
  problem_id: number;
  sort_order: number;
}
