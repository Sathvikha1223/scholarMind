from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.revision import RevisionPlanCreate, RevisionModifyRequest, RevisionPlanResponse
from app.services import revision_service

router = APIRouter(prefix="/revision", tags=["Revision Planner"])


@router.post("/create", response_model=RevisionPlanResponse, status_code=201)
def create_plan(
    data: RevisionPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return revision_service.create_revision_plan(
        db=db,
        user_id=current_user.id,
        subjects=data.subjects,
        exam_date=data.exam_date,
        study_hours_per_day=data.study_hours_per_day,
        break_preference=data.break_preference,
        title=data.title or "My Revision Plan",
    )


@router.get("/plans", response_model=List[RevisionPlanResponse])
def list_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return revision_service.get_revision_plans(db, current_user.id)


@router.get("/plans/{plan_id}", response_model=RevisionPlanResponse)
def get_plan(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.revision import RevisionPlan
    plan = db.query(RevisionPlan).filter(
        RevisionPlan.id == plan_id, RevisionPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.post("/modify", response_model=RevisionPlanResponse)
def modify_plan(
    data: RevisionModifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return revision_service.modify_revision_plan(db, data.plan_id, current_user.id, data.instruction)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
