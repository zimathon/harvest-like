#!/bin/bash

# Firestore Emulatorを適切に停止してデータをエクスポートするスクリプト

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Stopping Firestore Emulator and exporting data...${NC}"

# まずデータをエクスポート
echo -e "${YELLOW}Exporting Firestore data...${NC}"
firebase emulators:export ./firestore-data --project harvest-a82c0 --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Data exported successfully!${NC}"
else
    echo -e "${RED}❌ Failed to export data${NC}"
fi

# すべてのプロセスを停止
echo -e "${YELLOW}Stopping all processes...${NC}"
pkill -f "npm run dev:firestore" || true
pkill -f "firestore" || true
pkill -f "tsx watch" || true
pkill -f "vite" || true

echo -e "${GREEN}✅ All services stopped${NC}"