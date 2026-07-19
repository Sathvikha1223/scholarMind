// User types
export interface User {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

// Document types
export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';
export type FileType = 'pdf' | 'docx' | 'pptx' | 'txt' | 'md' | 'py' | 'java' | 'js' | 'c' | 'cpp' | 'sql' | 'html' | 'css';

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: DocumentStatus;
  chunk_count: number;
  page_count: number;
  created_at: string;
}

// Chat types
export interface Citation {
  document_name: string;
  page_num: number;
  chunk_text: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  document_ids: string[];
  created_at: string;
}

// Quiz types
export interface QuizQuestion {
  question: string;
  options?: string[] | null;
  correct_answer: string;
  explanation: string;
  type: 'mcq' | 'short_answer' | 'fill_blank';
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  document_id?: string;
  quiz_type: string;
  score: number;
  total_questions: number;
  questions_data: QuizQuestion[];
  submitted_at: string;
}

// Flashcard types
export interface FlashcardItem {
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  document_id?: string;
  title: string;
  cards: FlashcardItem[];
  created_at: string;
}

// Revision types
export interface StudySession {
  subject: string;
  topic: string;
  duration_minutes: number;
  type: 'study' | 'break';
  start_time: string;
}

export interface DailySchedule {
  date: string;
  day: string;
  total_hours: number;
  sessions: StudySession[];
}

export interface RevisionPlan {
  id: string;
  user_id: string;
  title: string;
  subjects: string[];
  exam_date?: string;
  study_hours_per_day: number;
  break_preference: string;
  plan_data: {
    total_days: number;
    daily_schedule: DailySchedule[];
  };
  created_at: string;
  updated_at: string;
}

// Analytics types
export interface AnalyticsOverview {
  total_documents: number;
  total_sessions: number;
  total_messages: number;
  total_quizzes: number;
  total_flashcard_decks: number;
  total_revision_plans: number;
  avg_quiz_score: number;
  study_streak: number;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface QuizScore {
  date: string;
  score: number;
  total: number;
  percentage: number;
  quiz_type: string;
}
