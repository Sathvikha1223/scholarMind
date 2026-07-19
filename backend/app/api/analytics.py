from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import AnalyticsOverview, AnalyticsUsageResponse
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_overview(db, current_user.id)


@router.get("/usage")
def get_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    daily = analytics_service.get_daily_activity(db, current_user.id)
    scores = analytics_service.get_quiz_scores(db, current_user.id)
    return {"daily_activity": daily, "quiz_scores": scores}


@router.get("/quiz-scores")
def get_quiz_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_quiz_scores(db, current_user.id)
