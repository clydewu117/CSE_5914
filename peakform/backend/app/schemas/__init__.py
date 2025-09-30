# Import all schemas for easy access
from .user import UserCreate, UserResponse, UserLogin, Token, TokenData
from .workout_plan import WorkoutPlanCreate, WorkoutPlanResponse, WorkoutPlanUpdate

__all__ = [
    "UserCreate",
    "UserResponse",
    "UserLogin",
    "Token",
    "TokenData",
    "WorkoutPlanCreate",
    "WorkoutPlanResponse",
    "WorkoutPlanUpdate",
]
