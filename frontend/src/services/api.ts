import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type {
  Token, User, Document, ChatSession, ChatMessage,
  QuizQuestion, QuizAttempt, FlashcardDeck, RevisionPlan,
  AnalyticsOverview, DailyActivity, QuizScore
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – inject JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor – handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { full_name: string; email: string; password: string }) =>
    api.post<Token>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<Token>('/auth/login', data).then((r) => r.data),

  getMe: () => api.get<User>('/auth/me').then((r) => r.data),

  updateMe: (data: { full_name?: string; password?: string }) =>
    api.put<User>('/auth/me', data).then((r) => r.data),
};

// ─── Documents ────────────────────────────────────────────────────────────────
export const documentsAPI = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<Document>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  list: () =>
    api.get<{ documents: Document[]; total: number }>('/documents/').then((r) => r.data),

  getOne: (id: string) => api.get<Document>(`/documents/${id}`).then((r) => r.data),

  delete: (id: string) => api.delete(`/documents/${id}`),

  getSummary: (id: string) =>
    api.get<{ document_id: string; summary: string; key_topics: string[]; word_count: number }>(
      `/documents/${id}/summary`
    ).then((r) => r.data),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  createSession: (data: { title?: string; document_ids?: string[] }) =>
    api.post<ChatSession>('/chat/sessions', data).then((r) => r.data),

  getSessions: () => api.get<ChatSession[]>('/chat/sessions').then((r) => r.data),

  deleteSession: (id: string) => api.delete(`/chat/sessions/${id}`),

  getHistory: (sessionId: string) =>
    api.get<ChatMessage[]>(`/chat/history/${sessionId}`).then((r) => r.data),

  sendMessage: (data: {
    session_id: string;
    content: string;
    document_ids?: string[];
    mode?: string;
  }) => api.post<ChatMessage>('/chat/message', data).then((r) => r.data),

  getMindmap: (documentId: string) =>
    api.get<{ document_id: string; mermaid_code: string }>(`/chat/mindmap/${documentId}`).then((r) => r.data),
};

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const quizAPI = {
  generate: (data: {
    document_id: string;
    quiz_type: string;
    num_questions: number;
    difficulty: string;
  }) => api.post<{ questions: QuizQuestion[]; quiz_type: string; document_id: string }>('/quiz/generate', data).then((r) => r.data),

  submit: (data: {
    document_id?: string;
    quiz_type: string;
    questions_data: QuizQuestion[];
    score: number;
    total_questions: number;
  }) => api.post<QuizAttempt>('/quiz/submit', data).then((r) => r.data),

  getHistory: () => api.get<QuizAttempt[]>('/quiz/history').then((r) => r.data),
};

// ─── Flashcards ───────────────────────────────────────────────────────────────
export const flashcardsAPI = {
  generate: (data: { document_id: string; num_cards: number }) =>
    api.post<FlashcardDeck>('/flashcards/generate', data).then((r) => r.data),

  list: (documentId?: string) =>
    api.get<FlashcardDeck[]>('/flashcards/', { params: documentId ? { document_id: documentId } : {} }).then((r) => r.data),

  getByDocument: (documentId: string) =>
    api.get<FlashcardDeck[]>(`/flashcards/${documentId}`).then((r) => r.data),
};

// ─── Revision ─────────────────────────────────────────────────────────────────
export const revisionAPI = {
  create: (data: {
    subjects: string[];
    exam_date?: string;
    study_hours_per_day: number;
    break_preference: string;
    title?: string;
  }) => api.post<RevisionPlan>('/revision/create', data).then((r) => r.data),

  getPlans: () => api.get<RevisionPlan[]>('/revision/plans').then((r) => r.data),

  modify: (data: { plan_id: string; instruction: string }) =>
    api.post<RevisionPlan>('/revision/modify', data).then((r) => r.data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getOverview: () => api.get<AnalyticsOverview>('/analytics/overview').then((r) => r.data),

  getUsage: () =>
    api.get<{ daily_activity: DailyActivity[]; quiz_scores: QuizScore[] }>('/analytics/usage').then((r) => r.data),

  getQuizScores: () => api.get<QuizScore[]>('/analytics/quiz-scores').then((r) => r.data),
};

export default api;
