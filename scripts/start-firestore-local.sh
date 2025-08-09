#!/bin/bash

# Firestore Local Development Startup Script
# This script starts all necessary services for local Firestore development

echo "🚀 Starting Firestore Local Development Environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Kill processes on specific ports if they're already in use
kill_port() {
    if check_port $1; then
        echo -e "${BLUE}Port $1 is in use. Killing existing process...${NC}"
        kill -9 $(lsof -ti:$1) 2>/dev/null
        sleep 1
    fi
}

# Clean up on exit
cleanup() {
    echo -e "\n${RED}Shutting down services...${NC}"
    kill $FIRESTORE_PID $SERVER_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Kill existing processes on required ports
kill_port 8090  # Firestore emulator
kill_port 4000  # Firestore UI
kill_port 5001  # Backend server
kill_port 5173  # Frontend dev server

# Start Firestore Emulator
echo -e "${GREEN}Starting Firestore Emulator...${NC}"
cd server && npm run firestore:start &
FIRESTORE_PID=$!
sleep 5  # Give Firestore time to start

# Start Backend Server with Firestore
echo -e "${GREEN}Starting Backend Server...${NC}"
cd server && FIRESTORE_EMULATOR_HOST=localhost:8090 npm run dev &
SERVER_PID=$!
sleep 3  # Give server time to start

# Start Frontend
echo -e "${GREEN}Starting Frontend Development Server...${NC}"
cd .. && npm run dev &
FRONTEND_PID=$!

echo -e "\n${GREEN}✅ All services started!${NC}"
echo -e "${BLUE}📍 Service URLs:${NC}"
echo "   - Frontend:        http://localhost:5173"
echo "   - Backend API:     http://localhost:5001"
echo "   - Firestore UI:    http://localhost:4000"
echo ""
echo -e "${BLUE}📝 API Endpoints:${NC}"
echo "   - MongoDB (v1):    http://localhost:5001/api/*"
echo "   - Firestore (v2):  http://localhost:5001/api/v2/*"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"

# Keep script running
wait