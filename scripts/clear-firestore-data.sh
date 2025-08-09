#!/bin/bash

# Firestore エミュレータのデータをクリアするスクリプト
echo "🗑️  Clearing Firestore emulator data..."

# サービスが起動中かチェック
if lsof -Pi :8090 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Warning: Firestore emulator is running on port 8090"
    echo "Please stop the emulator first with: npm run stop:all"
    exit 1
fi

# データディレクトリが存在するか確認
if [ -d "./server/.firestore-data" ]; then
    echo "📁 Found Firestore data directory"
    
    # 確認プロンプト
    read -p "Are you sure you want to delete all Firestore data? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf ./server/.firestore-data
        echo "✅ Firestore data cleared successfully!"
        echo ""
        echo "📝 Next steps:"
        echo "1. Start the services: npm run dev:firestore"
        echo "2. Create admin user: cd server && npm run create-admin:firestore"
    else
        echo "❌ Operation cancelled"
    fi
else
    echo "ℹ️  No Firestore data directory found"
    echo "Data directory path: ./server/.firestore-data"
fi