# Import all models for easy access from other modules
from .base import BaseModel
from .user import User
from .workout_plan import WorkoutPlan

# Ensure all models are registered to Base metadata
__all__ = ["BaseModel", "User", "WorkoutPlan"]