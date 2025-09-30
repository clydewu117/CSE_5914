from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WorkoutPlan, User
from app.schemas import WorkoutPlanCreate, WorkoutPlanResponse, WorkoutPlanUpdate
from app.api.auth import get_current_user

router = APIRouter()


@router.post("/api/plans", response_model=WorkoutPlanResponse)
async def create_workout_plan(
    plan: WorkoutPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new workout plan"""
    db_plan = WorkoutPlan(
        user_id=current_user.id,
        name=plan.name,
        experience=plan.experience,
        days_per_week=plan.days_per_week,
        muscle_groups=plan.muscle_groups,
        constraints=plan.constraints,
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.get("/api/plans/user", response_model=List[WorkoutPlanResponse])
async def get_user_workout_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """Get all workout plans for the current user"""
    plans = (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return plans


@router.get("/api/plans/{plan_id}", response_model=WorkoutPlanResponse)
async def get_workout_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific workout plan by ID"""
    plan = (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.id == plan_id, WorkoutPlan.user_id == current_user.id)
        .first()
    )

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout plan not found"
        )
    return plan


@router.put("/api/plans/{plan_id}", response_model=WorkoutPlanResponse)
async def update_workout_plan(
    plan_id: int,
    plan_update: WorkoutPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a workout plan"""
    db_plan = (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.id == plan_id, WorkoutPlan.user_id == current_user.id)
        .first()
    )

    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout plan not found"
        )

    # Update only provided fields
    update_data = plan_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_plan, field, value)

    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.delete("/api/plans/{plan_id}")
async def delete_workout_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a workout plan"""
    db_plan = (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.id == plan_id, WorkoutPlan.user_id == current_user.id)
        .first()
    )

    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout plan not found"
        )

    db.delete(db_plan)
    db.commit()
    return {"message": "Workout plan deleted successfully"}
