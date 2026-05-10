# Agentic Adaptive Control (AAC) Platform

Full-stack research simulation platform for adaptive DD-PID control augmented by hierarchical agentic reinforcement logic.

## Stack
- Frontend: Next.js 15+, TypeScript, Tailwind, Framer Motion, Recharts, Zustand
- Backend: FastAPI, asyncio, NumPy/SciPy
- Streaming: WebSocket telemetry (`/ws/telemetry`)
- Deployment: Docker Compose

## Run locally (without Docker)
### Backend
```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open:
- Landing: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Research: `http://localhost:3000/research`

## Run with Docker
```bash
docker compose up --build
```

## Implemented core capabilities
- Nonlinear plant simulation with disturbance/noise/scenario dynamics
- AAC vs baseline control comparison
- Edge/mid/cloud agent layers
- Confidence/UQ and 3-level fallback pipeline
- Context switching modes and adaptive CMAC resolution
- Live dashboard with streaming charts and agent activity
- Replay/speed controls and telemetry history endpoint
