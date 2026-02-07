export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Folder {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
}

export interface Problem {
  id: number;
  title: string;
  content: string;
  folder_id: number;
  image_url?: string;
  created_at: string;
}

export interface ProblemCreate {
  title: string;
  content: string;
  folder_id?: number;
  hints: string[];
}

export interface Hint {
  id: number;
  content: string;
  problem_id: number;
  created_at: string;
}

export interface SolveLog {
  id: number;
  problem_id: number;
  user_id: number;
  solution: string;
  is_correct: boolean;
  image_url?: string;
  created_at: string;
}

export interface ProblemWithHints extends Problem {
  hints: Hint[];
  image_url?: string;
}

export interface FolderWithProblems extends Folder {
  problems: Problem[];
}