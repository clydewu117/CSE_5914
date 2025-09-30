from sqlalchemy import Column, String, Integer, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel


class WorkoutPlan(BaseModel):
    """Workout plan model"""
    __tablename__ = "workout_plans"
    
    # Associate with user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Corresponding to frontend form fields
    name = Column(String(255), nullable=True, default="My Workout Plan")  # Plan name
    experience = Column(String(50), nullable=False)  # Experience level: beginner/intermediate/advanced
    days_per_week = Column(Integer, nullable=False)  # Training days per week: 1-7
    muscle_groups = Column(Text, nullable=True)  # Target muscle groups
    constraints = Column(Text, nullable=True)  # Physical constraints/limitations
    
    # AI generated content
    generated_plan = Column(JSON, nullable=True)  # AI generated detailed plan content
    generation_prompt = Column(Text, nullable=True)  # Prompt used for generation
    
    # Status management
    is_active = Column(Boolean, default=True, nullable=False)  # Whether it's an active plan
    is_favorite = Column(Boolean, default=False, nullable=False)  # Whether it's favorited
    
    # Relationship: associated with user
    user = relationship("User", back_populates="workout_plans")
    
    def __repr__(self):
        return f"<WorkoutPlan(id={self.id}, name='{self.name}', user_id={self.user_id})>"
    
    @property
    def experience_display(self):
        """Return friendly display name for experience level"""
        mapping = {
            "beginner": "Beginner",
            "intermediate": "Intermediate", 
            "advanced": "Advanced"
        }
        return mapping.get(str(self.experience), str(self.experience))