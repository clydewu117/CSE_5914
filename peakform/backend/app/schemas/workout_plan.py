from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class WorkoutPlanBase(BaseModel):
    """Base schema for workout plan"""

    name: Optional[str] = "My Workout Plan"
    experience: str = Field(
        ..., description="Experience level: beginner, intermediate, or advanced"
    )
    days_per_week: int = Field(..., ge=1, le=7, description="Training days per week")
    muscle_groups: Optional[str] = None
    constraints: Optional[str] = None

    @field_validator("experience")
    @classmethod
    def validate_experience(cls, v):
        if v not in ["beginner", "intermediate", "advanced"]:
            raise ValueError("Experience must be: beginner, intermediate, or advanced")
        return v


class WorkoutPlanCreate(WorkoutPlanBase):
    """Schema for creating a new workout plan"""

    pass


class WorkoutPlanUpdate(BaseModel):
    """Schema for updating a workout plan"""

    name: Optional[str] = None
    is_active: Optional[bool] = None
    is_favorite: Optional[bool] = None


class WorkoutPlanResponse(WorkoutPlanBase):
    """Schema for workout plan response"""

    id: int
    user_id: int
    generated_plan: Optional[Dict[str, Any]] = None
    generation_prompt: Optional[str] = None
    is_active: bool
    is_favorite: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkoutPlanListResponse(BaseModel):
    """Schema for workout plan list response"""

    plans: list[WorkoutPlanResponse]
    total: int
    page: int
    page_size: int
