import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.services.llm_service import get_llm_service
from app.models.revision import RevisionPlan

logger = logging.getLogger(__name__)


def create_revision_plan(
    db: Session,
    user_id: str,
    subjects: List[str],
    exam_date: str,
    study_hours_per_day: float,
    break_preference: str,
    title: str = "My Revision Plan",
) -> RevisionPlan:
    subjects_str = ", ".join(subjects)
    today = datetime.now().strftime("%Y-%m-%d")

    prompt = f"""Create a detailed study revision timetable.

Details:
- Subjects: {subjects_str}
- Exam Date: {exam_date or "in 2 weeks"}
- Study Hours Per Day: {study_hours_per_day}
- Break Style: {break_preference}
- Start Date: {today}

Generate a daily study schedule as a JSON object with this structure:
{{
  "total_days": <number>,
  "daily_schedule": [
    {{
      "date": "YYYY-MM-DD",
      "day": "Monday",
      "total_hours": {study_hours_per_day},
      "sessions": [
        {{
          "subject": "Subject Name",
          "topic": "Specific topic to cover",
          "duration_minutes": 60,
          "type": "study",
          "start_time": "09:00"
        }},
        {{
          "subject": "Break",
          "topic": "Rest",
          "duration_minutes": 15,
          "type": "break",
          "start_time": "10:00"
        }}
      ]
    }}
  ]
}}

Return ONLY valid JSON, no markdown."""

    llm = get_llm_service()
    raw = llm.generate(prompt)

    try:
        clean = raw.strip()
        if "```json" in clean:
            clean = clean.split("```json")[1].split("```")[0]
        elif "```" in clean:
            clean = clean.split("```")[1].split("```")[0]
        plan_data = json.loads(clean.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Revision plan JSON parse error: {e}")
        plan_data = {
            "total_days": 7,
            "daily_schedule": _generate_fallback_schedule(subjects, study_hours_per_day),
        }

    revision_plan = RevisionPlan(
        user_id=user_id,
        title=title,
        subjects=subjects,
        exam_date=exam_date,
        study_hours_per_day=study_hours_per_day,
        break_preference=break_preference,
        plan_data=plan_data,
    )
    db.add(revision_plan)
    db.commit()
    db.refresh(revision_plan)
    return revision_plan


def _generate_fallback_schedule(subjects: List[str], hours_per_day: float) -> List[Dict]:
    """Generate a basic schedule without LLM as fallback."""
    schedule = []
    today = datetime.now()
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for i in range(7):
        date = (today + timedelta(days=i)).strftime("%Y-%m-%d")
        day = days[(today.weekday() + i) % 7]
        subject = subjects[i % len(subjects)] if subjects else "General Study"
        sessions = [
            {
                "subject": subject,
                "topic": f"Review and Practice",
                "duration_minutes": int(hours_per_day * 60 * 0.8),
                "type": "study",
                "start_time": "09:00",
            },
            {
                "subject": "Break",
                "topic": "Rest",
                "duration_minutes": int(hours_per_day * 60 * 0.2),
                "type": "break",
                "start_time": "12:00",
            },
        ]
        schedule.append({"date": date, "day": day, "total_hours": hours_per_day, "sessions": sessions})
    return schedule


def modify_revision_plan(db: Session, plan_id: str, user_id: str, instruction: str) -> RevisionPlan:
    plan = db.query(RevisionPlan).filter(RevisionPlan.id == plan_id, RevisionPlan.user_id == user_id).first()
    if not plan:
        raise ValueError("Revision plan not found")

    current_plan_str = json.dumps(plan.plan_data, indent=2)

    prompt = f"""You are a study planner assistant. Modify the following revision plan based on the user instruction.

Current Plan:
{current_plan_str[:3000]}

User Instruction: "{instruction}"

Apply the modification and return the updated plan as valid JSON in the same structure. Return ONLY JSON, no markdown."""

    llm = get_llm_service()
    raw = llm.generate(prompt)

    try:
        clean = raw.strip()
        if "```json" in clean:
            clean = clean.split("```json")[1].split("```")[0]
        elif "```" in clean:
            clean = clean.split("```")[1].split("```")[0]
        new_plan_data = json.loads(clean.strip())
        plan.plan_data = new_plan_data
        db.commit()
        db.refresh(plan)
    except json.JSONDecodeError as e:
        logger.error(f"Plan modification JSON parse error: {e}")

    return plan


def get_revision_plans(db: Session, user_id: str) -> List[RevisionPlan]:
    return (
        db.query(RevisionPlan)
        .filter(RevisionPlan.user_id == user_id)
        .order_by(RevisionPlan.created_at.desc())
        .all()
    )
