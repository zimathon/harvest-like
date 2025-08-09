#!/bin/bash

# Quick start script for local development
echo "🚀 Harvest Local Development Quick Start"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}✗ Node.js not installed${NC}"
    exit 1
fi

# Check Java (for Firestore emulator)
if command -v java &> /dev/null; then
    echo -e "${GREEN}✓ Java installed${NC}"
else
    echo -e "${YELLOW}⚠ Java not installed (required for Firestore emulator)${NC}"
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker installed${NC}"
    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        echo -e "${GREEN}✓ Docker daemon is running${NC}"
    else
        echo -e "${RED}✗ Docker daemon is not running${NC}"
        echo "Please start Docker Desktop"
        exit 1
    fi
else
    echo -e "${RED}✗ Docker not installed${NC}"
    echo "Install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Function to open new terminal tab (macOS)
open_new_tab() {
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && $1\""
}

# Main menu
echo -e "\n${YELLOW}Select startup option:${NC}"
echo "1) Start MongoDB version (current)"
echo "2) Start with Firestore emulator (testing)"
echo "3) Start both (for migration testing)"
echo "4) Stop all services"
echo "5) Check service status"
echo "6) Run Firestore tests only"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo -e "\n${GREEN}Starting MongoDB version with Docker...${NC}"
        
        # Check if MongoDB container is running
        if docker ps | grep -q harvest-like-mongo; then
            echo -e "${GREEN}✓ MongoDB container is already running${NC}"
        else
            echo "Starting MongoDB container..."
            cd server
            docker-compose up -d mongo
            cd ..
            echo "Waiting for MongoDB to be ready..."
            sleep 5
        fi
        
        # Start backend
        echo "Starting backend server..."
        open_new_tab "cd server && npm run dev"
        
        # Start frontend
        echo "Starting frontend..."
        open_new_tab "npm run dev"
        
        echo -e "\n${GREEN}Services starting...${NC}"
        echo "Backend: http://localhost:5001"
        echo "Frontend: http://localhost:5173"
        echo -e "\n${YELLOW}Demo login:${NC}"
        echo "Email: demo@example.com"
        echo "Password: password123"
        ;;
        
    2)
        echo -e "\n${GREEN}Starting Firestore emulator version...${NC}"
        
        # Check Firebase CLI
        if ! command -v firebase &> /dev/null; then
            echo "Installing Firebase CLI..."
            npm install -g firebase-tools
        fi
        
        # Start Firestore emulator
        echo "Starting Firestore emulator..."
        open_new_tab "./scripts/setup-firestore-local.sh"
        
        echo -e "\n${YELLOW}Waiting for emulator to start...${NC}"
        sleep 5
        
        # Run Firestore tests
        echo "Running Firestore tests..."
        cd server && npm run test:firestore
        cd ..
        
        echo -e "\n${GREEN}Services running:${NC}"
        echo "Firestore Emulator: http://localhost:8080"
        echo "Emulator UI: http://localhost:4000"
        ;;
        
    3)
        echo -e "\n${GREEN}Starting both MongoDB and Firestore...${NC}"
        
        # Start MongoDB
        if docker ps | grep -q harvest-like-mongo; then
            echo -e "${GREEN}✓ MongoDB container is already running${NC}"
        else
            echo "Starting MongoDB container..."
            cd server
            docker-compose up -d mongo
            cd ..
            echo "Waiting for MongoDB to be ready..."
            sleep 5
        fi
        
        # Start Firestore emulator
        echo "Starting Firestore emulator..."
        open_new_tab "./scripts/setup-firestore-local.sh"
        
        # Start backend
        echo "Starting backend server..."
        open_new_tab "cd server && npm run dev"
        
        # Start frontend
        echo "Starting frontend..."
        open_new_tab "npm run dev"
        
        echo -e "\n${GREEN}All services starting...${NC}"
        echo "MongoDB: localhost:27017"
        echo "Firestore Emulator: http://localhost:8080"
        echo "Emulator UI: http://localhost:4000"
        echo "Backend: http://localhost:5001"
        echo "Frontend: http://localhost:5173"
        ;;
        
    4)
        echo -e "\n${YELLOW}Stopping all services...${NC}"
        
        # Stop MongoDB container
        echo "Stopping MongoDB container..."
        cd server
        docker-compose down
        cd ..
        
        # Kill Node processes
        echo "Stopping Node.js processes..."
        pkill -f "node.*dev"
        pkill -f "firebase emulators"
        
        echo -e "${GREEN}✓ All services stopped${NC}"
        ;;
        
    5)
        echo -e "\n${YELLOW}Checking service status...${NC}"
        
        # Check MongoDB container
        if docker ps | grep -q harvest-like-mongo; then
            echo -e "${GREEN}✓ MongoDB container is running${NC}"
            echo "  Container: harvest-like-mongo"
            echo "  Port: 27017"
        else
            echo -e "${RED}✗ MongoDB container is not running${NC}"
        fi
        
        # Check backend
        if lsof -i :5001 > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend is running on port 5001${NC}"
        else
            echo -e "${RED}✗ Backend is not running${NC}"
        fi
        
        # Check frontend
        if lsof -i :5173 > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Frontend is running on port 5173${NC}"
        else
            echo -e "${RED}✗ Frontend is not running${NC}"
        fi
        
        # Check Firestore emulator
        if lsof -i :8080 > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Firestore emulator is running on port 8080${NC}"
        else
            echo -e "${YELLOW}⚠ Firestore emulator is not running${NC}"
        fi
        ;;
        
    6)
        echo -e "\n${GREEN}Running Firestore tests...${NC}"
        
        # Check if emulator is running
        if ! lsof -i :8080 > /dev/null 2>&1; then
            echo "Starting Firestore emulator first..."
            open_new_tab "./scripts/setup-firestore-local.sh"
            echo "Waiting for emulator to start..."
            sleep 5
        fi
        
        cd server
        npm run test:firestore
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}Done!${NC}"