#!/bin/bash

# Setup script for Firestore emulator
echo "🔧 Setting up Firestore emulator for local development..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Check if Java is installed (required for emulator)
if ! command -v java &> /dev/null; then
    echo "❌ Java is required for Firestore emulator. Please install Java 11 or higher."
    echo "On macOS: brew install openjdk@11"
    exit 1
fi

echo "✅ Firebase CLI is installed"
echo "✅ Java is installed"

# Start emulator
echo "🚀 Starting Firestore emulator..."
echo "📍 Firestore: http://localhost:8080"
echo "📍 Emulator UI: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop the emulator"

firebase emulators:start --only firestore