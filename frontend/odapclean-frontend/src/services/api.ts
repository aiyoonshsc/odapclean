import axios from 'axios';
import type { Folder, Problem, ProblemWithHints, ProblemCreate } from '../types';

const API_URL = 'http://localhost:8001/api/v1'; // FastAPI 서버 주소

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getFolders = async (): Promise<Folder[]> => {
  const response = await apiClient.get('/folders');
  return response.data;
};

export const createFolder = async (folderName: string): Promise<Folder> => {
  const response = await apiClient.post('/folders', { name: folderName, user_id: 1 }); // 임시 user_id
  return response.data;
};

export const getProblems = async (folderId?: number): Promise<ProblemWithHints[]> => {
  const url = folderId ? `/problems?folder_id=${folderId}` : '/problems';
  const response = await apiClient.get(url);
  return response.data;
};

export const createProblem = async (problemData: FormData): Promise<ProblemWithHints> => {
  const response = await apiClient.post('/problems', problemData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getProblem = async (problemId: number): Promise<ProblemWithHints> => {
  const response = await apiClient.get(`/problems/${problemId}`);
  return response.data;
};

export const solveProblem = async (problemId: number, solution: string, image: Blob | null): Promise<void> => {
  const formData = new FormData();
  formData.append('solution', solution);
  if (image) {
    formData.append('file', image, 'solution.jpg');
  }

  await apiClient.post(`/problems/${problemId}/solve`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};