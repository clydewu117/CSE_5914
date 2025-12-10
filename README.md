# CSE-5914 Capstone Project – PeakForm

End-to-end workout plan generator with a Next.js front end and a FastAPI backend.

## Repository Layout
- `peakform/`: Next.js app
- `peakform/backend/`: FastAPI service
- `peakform/docker-compose.yml`: optional local services (Elasticsearch)

## Frontend (Next.js)
```bash
cd peakform
npm install          # first time only
npm run dev
```
Open http://localhost:3000 to view the app. Edit `src` files and the page reloads automatically.

## Backend (FastAPI)
Run the setup script (recommended):
```bash
cd peakform/backend
./setup.sh
source peakform/bin/activate
python run_dev.py
```

Or set up manually:
```bash
cd peakform/backend
python3 -m venv peakform
source peakform/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python run_dev.py
```

API docs after the server starts:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Environment & Optional Elasticsearch
Copy `.env.example` to `.env` in `peakform/backend` and adjust values. Defaults expect SQLite. If you want local Elasticsearch for retrieval-augmented responses:
```bash
cd peakform
docker compose up -d es01     # or `docker compose up -d` for the whole stack
# later
docker compose down
```
Backend reads `ELASTICSEARCH_URL`, `ELASTIC_USERNAME`, `ELASTIC_PASSWORD`, and `ELASTIC_INDEX`; it will still run if Elasticsearch is absent.
