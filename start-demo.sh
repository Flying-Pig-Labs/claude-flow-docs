#!/bin/bash

echo "🚗 Starting CarMax AutoCare Network Demo..."
echo "==========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Start backend
echo "📦 Starting backend server..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

echo "Installing backend dependencies..."
pip install -r requirements.txt -q

echo "🚀 Starting FastAPI backend on http://localhost:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd ..

# Start frontend
echo "📦 Starting frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

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
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait