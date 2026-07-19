from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.quiz import QuizGenerateRequest, QuizSubmitRequest, QuizAttemptResponse
from app.services import quiz_service, analytics_service

router = APIRouter(prefix="/quiz", tags=["Quiz"])


@router.post("/generate")
def generate_quiz(
    data: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    questions = quiz_service.generate_quiz(
        db=db,
        document_id=data.document_id,
        user_id=current_user.id,
        quiz_type=data.quiz_type,
        num_questions=data.num_questions,
        difficulty=data.difficulty,
    )
    analytics_service.log_event(db, current_user.id, "quiz_generated", {"document_id": data.document_id})
    return {"questions": questions, "quiz_type": data.quiz_type, "document_id": data.document_id}


@router.post("/submit", response_model=QuizAttemptResponse)
def submit_quiz(
    data: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = quiz_service.save_quiz_attempt(
        db=db,
        user_id=current_user.id,
        document_id=data.document_id,
        quiz_type=data.quiz_type,
        questions_data=data.questions_data,
        score=data.score,
        total_questions=data.total_questions,
    )
    analytics_service.log_event(db, current_user.id, "quiz_submitted", {"score": data.score})
    return attempt


@router.get("/history", response_model=List[QuizAttemptResponse])
def get_quiz_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return quiz_service.get_quiz_history(db, current_user.id)
