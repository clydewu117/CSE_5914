from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
import json
import httpx
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WorkoutPlan, User
from app.schemas import WorkoutPlanCreate, WorkoutPlanResponse, WorkoutPlanUpdate
from app.api.auth import get_current_user
from app.config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_API_BASE

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


def _build_generation_prompt(data: WorkoutPlanCreate) -> str:
    lines = [
        "You are a fitness coach. Design a weekly workout plan as structured JSON.",
        "Constraints:",
        "- Return ONLY valid JSON, no extra commentary.",
        "- Use keys: weeks, days, focus, exercises, sets, reps, rest, notes.",
        "- Make it realistic for the user's experience and constraints.",
        "",
        f"Experience: {data.experience}",
        f"Days per week: {data.days_per_week}",
        f"Target muscles: {data.muscle_groups or 'unspecified'}",
        f"Constraints: {data.constraints or 'none'}",
    ]
    return "\n".join(lines)


@router.post("/api/plans/generate", response_model=WorkoutPlanResponse)
async def create_and_generate_workout_plan(
    plan: WorkoutPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a workout plan and generate AI content via Gemini, then save."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    # 1) Create the plan row first
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

    # 2) Build prompt and call Gemini
    prompt = _build_generation_prompt(plan)
    url = f"{GEMINI_API_BASE}/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                ],
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.7,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=body, headers={"Content-Type": "application/json"})
            if resp.status_code >= 400:
                raise HTTPException(status_code=502, detail=f"Gemini error: {resp.text[:200]}")
            payload = resp.json()

        # Extract JSON text from response
        # Typical structure: candidates[0].content.parts[0].text
        text = (
            payload.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text")
        )
        generated_json = None
        if text:
            try:
                generated_json = json.loads(text)
            except Exception:
                # If it returned plain text with code fences or commentary, attempt to strip
                cleaned = text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.strip("`")
                    # remove potential language hint
                    cleaned = "\n".join(line for line in cleaned.splitlines() if not line.strip().startswith("json"))
                try:
                    generated_json = json.loads(cleaned)
                except Exception:
                    generated_json = {"raw": text}

        # 3) Save generation results
        db_plan.generated_plan = generated_json
        db_plan.generation_prompt = prompt
        db.commit()
        db.refresh(db_plan)
        return db_plan
    except HTTPException:
        # Bubble up known HTTP errors
        raise
    except Exception as e:
        # On failure, keep the created plan but without generated content
        raise HTTPException(status_code=502, detail=f"Failed to generate plan: {str(e)[:200]}")
