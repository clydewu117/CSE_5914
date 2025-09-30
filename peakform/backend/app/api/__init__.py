# Import all API routers for easy registration
from .health import router as health_router
from .plans import router as plans_router
from .auth import router as auth_router

__all__ = ["health_router", "plans_router", "auth_router"]
