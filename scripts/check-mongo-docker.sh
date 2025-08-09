#!/bin/bash

# Check MongoDB Docker container status
echo "🔍 Checking MongoDB Docker setup..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if container exists
if docker ps -a | grep -q harvest-like-mongo; then
    echo -e "${GREEN}✓ MongoDB container exists${NC}"
    
    # Check if it's running
    if docker ps | grep -q harvest-like-mongo; then
        echo -e "${GREEN}✓ MongoDB container is running${NC}"
        
        # Show container details
        echo -e "\n${YELLOW}Container details:${NC}"
        docker ps --filter "name=harvest-like-mongo" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        # Test connection
        echo -e "\n${YELLOW}Testing MongoDB connection...${NC}"
        if docker exec harvest-like-mongo mongosh --eval "db.version()" &> /dev/null; then
            echo -e "${GREEN}✓ MongoDB is responsive${NC}"
            MONGO_VERSION=$(docker exec harvest-like-mongo mongosh --eval "db.version()" --quiet)
            echo "  Version: $MONGO_VERSION"
        else
            echo -e "${RED}✗ Cannot connect to MongoDB${NC}"
        fi
        
        # Show database info
        echo -e "\n${YELLOW}Database info:${NC}"
        docker exec harvest-like-mongo mongosh --eval "use harvest-like; db.stats()" --quiet
        
    else
        echo -e "${RED}✗ MongoDB container exists but is not running${NC}"
        echo "  Run: cd server && docker-compose up -d mongo"
    fi
else
    echo -e "${RED}✗ MongoDB container does not exist${NC}"
    echo "  Run: cd server && docker-compose up -d mongo"
fi

# Check Docker Compose file
echo -e "\n${YELLOW}Docker Compose configuration:${NC}"
if [ -f "server/docker-compose.yml" ]; then
    echo -e "${GREEN}✓ docker-compose.yml exists${NC}"
    echo "  MongoDB port: 27017"
    echo "  Container name: harvest-like-mongo"
    echo "  Database: harvest-like"
else
    echo -e "${RED}✗ docker-compose.yml not found${NC}"
fi