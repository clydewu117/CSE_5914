# PeakForm Backend

A FastAPI-based workout plan generation API that supports user authentication and personalized workout plan management.

## Features

- **User Authentication**: JWT token authentication with registration and login
- **Workout Plan Management**: Create, view, update, and delete personal workout plans
- **Database Support**: SQLAlchemy ORM with SQLite
- **Auto Documentation**: FastAPI automatically generated API documentation

## Quick Setup

### Automatic Setup (Recommended)

```bash
# Run the setup script
./setup.sh

# Start development server
source venv/bin/activate
python run_dev.py
```

### Manual Setup

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env

# 4. Run database migrations
alembic upgrade head

# 5. Start development server
python run_dev.py
```

## API Documentation

After starting the server:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## Environment Configuration

Copy `.env.example` to `.env` and modify as needed:

```env
DATABASE_URL=sqlite:///./peakform.db
SECRET_KEY=your-super-secret-jwt-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
```