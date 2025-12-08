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
source peakform/bin/activate
python run_dev.py
```

### Manual Setup

```bash
# 1. Create and activate virtual environment
python3 -m venv peakform
source peakform/bin/activate

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

## Elasticsearch (local dev)

The backend can optionally query a local Elasticsearch service to provide retrieval-augmented examples to the Gemini generator. If Elasticsearch is not available the backend continues to work but skips ES retrieval.

Quick start (run only ES):

```bash
# from the `peakform` folder where `docker-compose.yml` lives
docker compose up -d es01

# stop and remove services/volumes created by compose
docker compose down
```

Start the whole compose stack:

```bash
docker compose up -d
```

Environment variables the backend reads for ES:

- `ELASTICSEARCH_URL` (default: `http://localhost:9200`)
- `ELASTIC_USERNAME` (default: `elastic`)
- `ELASTIC_PASSWORD` (default set in `docker-compose.yml` for local dev)
- `ELASTIC_INDEX` (default: `exercises`)

If you prefer to use a remote Elasticsearch cluster, export the variables above before starting the backend. If you'd like the backend to wait for Elasticsearch before handling requests, I can add a simple startup health-check helper.