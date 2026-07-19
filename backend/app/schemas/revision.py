from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any


class RevisionPlanCreate(BaseModel):
    subjects: List[str]
    exam_date: Optional[str] = None
    study_hours_per_day: float = 4.0
    break_preference: str = "Pomodoro"
    title: Optional[str] = "My Revision Plan"


class RevisionModifyRequest(BaseModel):
    plan_id: str
    instruction: str  # Natural language: "Move DBMS to tomorrow"


class DailySchedule(BaseModel):
    date: str
    day: str
    sessions: List[Dict[str, Any]]


class RevisionPlanResponse(BaseModel):
    id: str
    user_id: str
    title: str
    subjects: List[str]
    exam_date: Optional[str]
    study_hours_per_day: float
    break_preference: str
    plan_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
