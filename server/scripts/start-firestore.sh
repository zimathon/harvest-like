#!/bin/bash

# Firestore Emulatorを永続化付きで起動するスクリプト

# Java 17のパスを設定
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# 色付きログ出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Firestore Emulator with data persistence...${NC}"

# データディレクトリが存在しない場合は作成
if [ ! -d "./firestore-data" ]; then
    echo -e "${YELLOW}Creating firestore-data directory for persistence...${NC}"
    mkdir -p ./firestore-data
fi

# 既存のデータがあるかチェック
if [ -d "./firestore-data/firestore_export" ]; then
    echo -e "${GREEN}✅ Found existing Firestore data. It will be loaded automatically.${NC}"
else
    echo -e "${YELLOW}⚠️  No existing data found. Starting with empty database.${NC}"
    echo -e "${YELLOW}   Run 'npm run create-admin:firestore' to create an admin user.${NC}"
fi

# Firestore Emulatorを起動
echo -e "${GREEN}Starting Firestore Emulator...${NC}"

# トラップを設定してCtrl+C時にエクスポートを実行
trap 'echo -e "${YELLOW}Exporting data before exit...${NC}"; firebase emulators:export ./firestore-data --project harvest-a82c0 --force; exit' INT TERM

firebase emulators:start \
    --only firestore \
    --import=./firestore-data \
    --export-on-exit=./firestore-data \
    --project harvest-a82c0