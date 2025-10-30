This project contains a multi-service Docker setup for the Next.js frontend and FastAPI backend.

Files added:
- `Dockerfile.frontend` - Multi-stage build for the Next.js app (production).
- `backend/Dockerfile` - Dockerfile for the FastAPI backend.
- `docker-compose.yml` - Runs both services together (frontend on 3000, backend on 8000).
- `.dockerignore` - Files to exclude from Docker context.

Quick start (requires Docker and docker-compose):

```powershell
docker compose up --build
```

Open the frontend at http://localhost:3000 and the backend at http://localhost:8000.

Notes:
- The backend service mounts `./backend` into the container for live development. Remove the `volumes` entry in `docker-compose.yml` for strict containerized production builds.
- The frontend builds with `npm run build` and runs `npm start`. If you want development mode with hot reload, adjust the command and expose the correct ports.
