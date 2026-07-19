import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    quiz_type: Mapped[str] = mapped_column(String(50), nullable=False, default="mcq")
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_data: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="quiz_attempts")
