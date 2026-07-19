import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON, Float, func, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class RevisionPlan(Base):
    __tablename__ = "revision_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False, default="My Revision Plan")
    subjects: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    exam_date: Mapped[str] = mapped_column(String(20), nullable=True)
    study_hours_per_day: Mapped[float] = mapped_column(Float, nullable=False, default=4.0)
    break_preference: Mapped[str] = mapped_column(String(100), nullable=False, default="Pomodoro")
    plan_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="revision_plans")
