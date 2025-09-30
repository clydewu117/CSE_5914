from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel


class User(BaseModel):
    """User model"""
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationship: one user can have multiple workout plans
    workout_plans = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"