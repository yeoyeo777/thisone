# Pump.Fun Token Launcher

Full-stack application for launching tokens on Pump.fun with Solana blockchain integration.

## Project Structure

```
pumpfun-backend/
├── frontend/          # React + Vite frontend
├── backend/           # Express + TypeScript backend
└── package.json       # Root package with convenience scripts
```

## Setup

1. Install dependencies for both frontend and backend:
```bash
npm run install:all
```

Or install separately:
```bash
cd frontend && npm install
cd backend && npm install
```

## Development

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run separately:
```bash
npm run dev:backend  # Backend on port 3001
npm run dev:frontend # Frontend on port 5173
```

## Production Build

```bash
npm run build
```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /launch` - Token launch endpoint (WIP)

## GitHub Repository

https://github.com/yeoyeo777/thisone
