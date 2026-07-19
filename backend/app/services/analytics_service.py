from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.document import Document
from app.models.chat import ChatSession, ChatMessage
from app.models.quiz import QuizAttempt
from app.models.flashcard import FlashcardDeck
from app.models.revision import RevisionPlan
from app.models.analytics import AnalyticsEvent


def get_overview(db: Session, user_id: str) -> Dict[str, Any]:
    total_documents = db.query(Document).filter(Document.user_id == user_id).count()
    total_sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).count()
    total_messages = (
        db.query(ChatMessage)
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .filter(ChatSession.user_id == user_id)
        .count()
    )
    total_quizzes = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).count()
    total_flashcard_decks = db.query(FlashcardDeck).filter(FlashcardDeck.user_id == user_id).count()
    total_revision_plans = db.query(RevisionPlan).filter(RevisionPlan.user_id == user_id).count()

    quiz_scores = db.query(QuizAttempt.score).filter(QuizAttempt.user_id == user_id).all()
    avg_quiz_score = sum(s[0] for s in quiz_scores) / len(quiz_scores) if quiz_scores else 0.0

    # Calculate streak (consecutive days with activity)
    streak = _calculate_streak(db, user_id)

    return {
        "total_documents": total_documents,
        "total_sessions": total_sessions,
        "total_messages": total_messages,
        "total_quizzes": total_quizzes,
        "total_flashcard_decks": total_flashcard_decks,
        "total_revision_plans": total_revision_plans,
        "avg_quiz_score": round(avg_quiz_score, 2),
        "study_streak": streak,
    }


def _calculate_streak(db: Session, user_id: str) -> int:
    events = (
        db.query(func.date(AnalyticsEvent.created_at))
        .filter(AnalyticsEvent.user_id == user_id)
        .distinct()
        .order_by(func.date(AnalyticsEvent.created_at).desc())
        .all()
    )
    if not events:
        return 0

    streak = 0
    today = datetime.utcnow().date()
    for (event_date,) in events:
        if isinstance(event_date, str):
            event_date = datetime.strptime(event_date, "%Y-%m-%d").date()
        if event_date == today - timedelta(days=streak):
            streak += 1
        else:
            break
    return streak


def log_event(db: Session, user_id: str, event_type: str, metadata: Dict = None) -> None:
    event = AnalyticsEvent(
        user_id=user_id,
        event_type=event_type,
        metadata_json=metadata or {},
    )
    db.add(event)
    db.commit()


def get_daily_activity(db: Session, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
    since = datetime.utcnow() - timedelta(days=days)
    events = (
        db.query(
            func.date(AnalyticsEvent.created_at).label("date"),
            func.count(AnalyticsEvent.id).label("count"),
        )
        .filter(AnalyticsEvent.user_id == user_id, AnalyticsEvent.created_at >= since)
        .group_by(func.date(AnalyticsEvent.created_at))
        .order_by(func.date(AnalyticsEvent.created_at))
        .all()
    )
    return [{"date": str(e.date), "count": e.count} for e in events]


def get_quiz_scores(db: Session, user_id: str) -> List[Dict[str, Any]]:
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.submitted_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "date": a.submitted_at.strftime("%Y-%m-%d"),
            "score": a.score,
            "total": a.total_questions,
            "percentage": round((a.score / a.total_questions * 100) if a.total_questions else 0, 1),
            "quiz_type": a.quiz_type,
        }
        for a in attempts
    ]
