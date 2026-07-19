from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class QuizGenerateRequest(BaseModel):
    document_id: str
    quiz_type: str = "mcq"  # mcq | short_answer | fill_blank
    num_questions: int = 5
    difficulty: str = "medium"  # easy | medium | hard


class QuizQuestion(BaseModel):
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    type: str


class QuizSubmitRequest(BaseModel):
    document_id: Optional[str] = None
    quiz_type: str
    questions_data: List[dict]
    score: float
    total_questions: int


class QuizResult(BaseModel):
    id: str
    score: float
    total_questions: int
    percentage: float
    submitted_at: datetime

    model_config = {"from_attributes": True}


class QuizAttemptResponse(BaseModel):
    id: str
    user_id: str
    document_id: Optional[str]
    quiz_type: str
    score: float
    total_questions: int
    questions_data: List[dict]
    submitted_at: datetime

    model_config = {"from_attributes": True}
