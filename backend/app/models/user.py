import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    documents: Mapped[list] = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    chat_sessions: Mapped[list] = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts: Mapped[list] = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    flashcard_decks: Mapped[list] = relationship("FlashcardDeck", back_populates="user", cascade="all, delete-orphan")
    revision_plans: Mapped[list] = relationship("RevisionPlan", back_populates="user", cascade="all, delete-orphan")
    analytics_events: Mapped[list] = relationship("AnalyticsEvent", back_populates="user", cascade="all, delete-orphan")
