#!/bin/bash

echo "🚗 Starting CarMax AutoCare Network Demo..."
echo "==========================================="

# Kill any existing processes on the ports
echo "Cleaning up any existing processes..."
kill $(lsof -ti:3000) 2>/dev/null || true
kill $(lsof -ti:8000) 2>/dev/null || true

# Start backend
echo "📦 Starting backend server..."
cd backend
source venv/bin/activate

echo "🚀 Starting FastAPI backend on http://localhost:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd ..

# Start frontend
echo "📦 Starting frontend..."
cd frontend

echo "🚀 Starting React frontend on http://localhost:3000"
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Demo is starting up!"
echo "===================================="
echo "🔹 Backend API: http://localhost:8000"
echo "🔹 Frontend App: http://localhost:3000"
echo "🔹 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the demo"
echo ""

# Wait for interrupt
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait