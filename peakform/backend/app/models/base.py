from datetime import datetime
from sqlalchemy import Column, Integer, DateTime
from ..database import Base


class TimestampMixin:
    """Common timestamp Mixin"""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class BaseModel(Base, TimestampMixin):
    """Abstract base model"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)