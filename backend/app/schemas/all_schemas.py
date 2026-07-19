from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None


# --- DOCUMENT SCHEMAS ---
class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- CHAT SCHEMAS ---
class ChatMessageCreate(BaseModel):
    content: str

class Citation(BaseModel):
    filename: str
    page: Optional[int] = None

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    sender: str
    content: str
    citations: Optional[List[Citation]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionCreate(BaseModel):
    title: str

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- REVISION SCHEMAS ---
class RevisionPlanCreate(BaseModel):
    subjects: List[str]
    study_hours_per_day: int
    exam_dates: Dict[str, str]  # {subject: YYYY-MM-DD}
    break_preferences: Optional[str] = None

class RevisionPlanResponse(BaseModel):
    id: int
    subjects: List[str]
    study_hours_per_day: int
    exam_dates: Dict[str, str]
    break_preferences: Optional[str] = None
    timetable: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class RevisionCommand(BaseModel):
    command: str


# --- QUIZ SCHEMAS ---
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizGenerateRequest(BaseModel):
    document_id: int
    title: str
    num_questions: int = 5

class QuizResponse(BaseModel):
    id: int
    document_id: Optional[int]
    title: str
    questions: List[QuizQuestion]
    score: Optional[int]
    max_score: int
    created_at: datetime

    class Config:
        from_attributes = True

class QuizSubmit(BaseModel):
    score: int


# --- FLASHCARD SCHEMAS ---
class FlashcardItem(BaseModel):
    front: str
    back: str

class FlashcardGenerateRequest(BaseModel):
    document_id: int
    title: str
    num_cards: int = 10

class FlashcardSetResponse(BaseModel):
    id: int
    document_id: Optional[int]
    title: str
    cards: List[FlashcardItem]
    created_at: datetime

    class Config:
        from_attributes = True


# --- STUDY AID REQUEST ---
class StudyAidRequest(BaseModel):
    document_id: int
    mode: str  # "summary", "revision_sheet", "bullet_notes", "interview_prep"
    difficulty: str  # "beginner", "intermediate", "advanced", "interview"


# --- ANALYTICS SCHEMAS ---
class SubjectScore(BaseModel):
    subject: str
    average_score: float

class AnalyticsResponse(BaseModel):
    uploaded_documents: int
    ai_conversations: int
    study_time_hours: float
    quizzes_generated: int
    average_quiz_score: float
    strongest_subjects: List[SubjectScore]
    weakest_subjects: List[SubjectScore]
    frequently_searched: List[str]
    current_streak: int
    longest_streak: int
    revision_progress_percent: float
