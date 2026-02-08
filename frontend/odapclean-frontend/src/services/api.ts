import axios from 'axios';
import type { 
  Folder, Curriculum, CurriculumCreate, Problem, ProblemCreate, ProblemWithHints, StudySession, StudySessionCreate, Token, UserCreate, StatisticsResponse, 
  FolderReorderItem, CurriculumReorderItem, ProblemReorderItem
} from '../types/definitions';

const apiClient = axios.create({
  baseURL: 'http://192.168.219.108:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const login = async (formData: FormData): Promise<Token> => {
    const response = await apiClient.post<Token>('/token', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const register = async (user: UserCreate): Promise<any> => {
    const response = await apiClient.post('/register', user);
    return response.data;
};

export const autoCropImage = async (file: File): Promise<{ x: number, y: number, width: number, height: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/utils/auto-crop', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getFolders = async (): Promise<Folder[]> => {
  const response = await apiClient.get('/folders');
  return response.data;
};

export const createFolder = async (name: string): Promise<Folder> => {
  const response = await apiClient.post('/folders', { name });
  return response.data;
};

export const updateFolder = async (folder_id: number, name: string): Promise<Folder> => {
  const response = await apiClient.put(`/folders/${folder_id}`, { name });
  return response.data;
};

export const deleteFolder = async (folder_id: number): Promise<void> => {
  await apiClient.delete(`/folders/${folder_id}`);
};

export const reorderFolders = async (items: FolderReorderItem[]): Promise<void> => {
  await apiClient.put('/folders/reorder', items);
};

export const getCurriculums = async (): Promise<Curriculum[]> => {
  const response = await apiClient.get('/curriculums');
  return response.data;
};

export const createCurriculum = async (curriculum: CurriculumCreate): Promise<Curriculum> => {
  const response = await apiClient.post('/curriculums', curriculum);
  return response.data;
};

export const updateCurriculum = async (curriculum_id: number, curriculum: CurriculumCreate): Promise<Curriculum> => {
  const response = await apiClient.put(`/curriculums/${curriculum_id}`, curriculum);
  return response.data;
};

export const deleteCurriculum = async (curriculum_id: number): Promise<void> => {
  await apiClient.delete(`/curriculums/${curriculum_id}`);
};

export const reorderCurriculums = async (items: CurriculumReorderItem[]): Promise<void> => {
  await apiClient.put('/curriculums/reorder', items);
};

export const getFilteredProblems = async (
  status: string, 
  folderId?: number, 
  curriculumId?: number,
  sortBy: string = 'date_desc'
): Promise<Problem[]> => {
  const params: any = { status, sort_by: sortBy };
  if (folderId) params.folder_id = folderId;
  if (curriculumId) params.curriculum_id = curriculumId;
  
  const response = await apiClient.get('/problems', { params });
  return response.data;
};

export const getProblems = async (folderId?: number, curriculumId?: number, sortBy: string = 'date_desc'): Promise<Problem[]> => {
  return getFilteredProblems('all', folderId, curriculumId, sortBy);
};

export const getProblem = async (problem_id: number): Promise<ProblemWithHints> => {
  const response = await apiClient.get(`/problems/${problem_id}`);
  return response.data;
};

export const createProblem = async (problem: FormData): Promise<Problem> => {
  const response = await apiClient.post('/problems', problem, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateProblem = async (problem_id: number, problem: Partial<ProblemCreate>): Promise<Problem> => {
  const response = await apiClient.put(`/problems/${problem_id}`, problem);
  return response.data;
};

export const deleteProblem = async (problem_id: number): Promise<void> => {
  await apiClient.delete(`/problems/${problem_id}`);
};

export const reorderProblems = async (items: ProblemReorderItem[]): Promise<void> => {
  await apiClient.put('/problems/reorder', items);
};

export const solveProblem = async (
  problem_id: number, 
  solution: string, 
  isCorrect: boolean,
  timeSpent?: number,
  studySessionId?: number
): Promise<void> => {
  const data = {
    solution,
    is_correct: isCorrect,
    time_spent: timeSpent,
    study_session_id: studySessionId
  };
  
  await apiClient.post(`/problems/${problem_id}/solve`, data);
};

export const getSessions = async (): Promise<StudySession[]> => {
  const response = await apiClient.get('/sessions');
  return response.data;
};

export const createSession = async (session: StudySessionCreate): Promise<StudySession> => {
  const response = await apiClient.post('/sessions', session);
  return response.data;
};

export const deleteSession = async (study_session_id: number): Promise<void> => {
  await apiClient.delete(`/sessions/${study_session_id}`);
};

export const getSessionProblems = async (sessionId: number): Promise<ProblemWithHints[]> => {
  const response = await apiClient.get(`/sessions/${sessionId}/problems`);
  return response.data;
};

export const getStatistics = async (): Promise<StatisticsResponse> => {
  const response = await apiClient.get('/statistics');
  return response.data;
};
