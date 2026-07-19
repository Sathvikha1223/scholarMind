from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class AnalyticsOverview(BaseModel):
    total_documents: int
    total_sessions: int
    total_messages: int
    total_quizzes: int
    total_flashcard_decks: int
    total_revision_plans: int
    avg_quiz_score: float
    study_streak: int


class QuizScoreEntry(BaseModel):
    date: str
    score: float
    quiz_type: str
    document_id: Optional[str] = None


class DocumentUsage(BaseModel):
    document_id: str
    filename: str
    query_count: int


class AnalyticsUsageResponse(BaseModel):
    daily_activity: List[Dict[str, Any]]
    document_usage: List[DocumentUsage]
    quiz_scores: List[QuizScoreEntry]
