#!/bin/bash

# GrammarWizard - Quick Setup Script
# This script helps you set up the project for testing and building

set -e

echo "🚀 GrammarWizard Setup Script"
echo "=============================="
echo ""

# Step 1: Install Dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Create .env.local
echo "🔑 Step 2: Setting up environment variables..."
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "⚠️  Created .env.local"
    echo "   Please add your GEMINI_API_KEY"
    echo "   Get it free at: https://ai.studio/apikeys"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Step 3: Check Node version
echo "🔍 Step 3: Checking Node.js version..."
node_version=$(node -v)
echo "✅ Using $node_version"
echo ""

# Step 4: Install Capacitor (for APK building)
echo "📱 Step 4: Installing Capacitor for Android..."
npm install @capacitor/core @capacitor/cli @capacitor/android --save
echo "✅ Capacitor installed"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Edit .env.local and add GEMINI_API_KEY"
echo "2️⃣  Run development server:"
echo "    npm run dev"
echo "3️⃣  Open browser: http://localhost:3000"
echo "4️⃣  Test the app"
echo "5️⃣  When ready, build APK:"
echo "    npm run build:apk"
echo ""
echo "📚 Full guide: See TESTING_AND_BUILD_GUIDE.md"
echo ""
