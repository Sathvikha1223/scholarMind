from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.all_models import User, Quiz
from app.schemas.all_schemas import QuizGenerateRequest, QuizResponse, QuizSubmit
from app.services import auth_service, ai_service

router = APIRouter(prefix="/quizzes", tags=["Quiz Center"])

@router.post("/", response_model=QuizResponse)
def generate_quiz(
    data: QuizGenerateRequest,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    return ai_service.generate_quiz(
        db=db,
        user_id=current_user.id,
        document_id=data.document_id,
        title=data.title,
        num_questions=data.num_questions
    )

@router.get("/", response_model=List[QuizResponse])
def list_quizzes(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Quiz).filter(Quiz.user_id == current_user.id).order_by(Quiz.created_at.desc()).all()

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@router.post("/{quiz_id}/submit", response_model=QuizResponse)
def submit_quiz_score(
    quiz_id: int,
    data: QuizSubmit,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    quiz.score = data.score
    db.commit()
    db.refresh(quiz)
    return quiz
