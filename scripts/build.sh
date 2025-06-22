#!/bin/bash

echo "🚀 Building Social Affiliate Pro..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build backend
echo "🔧 Building backend..."
npm run build:server

# Build frontend
echo "🎨 Building frontend..."
npm run build:client

# Generate database migrations
echo "🗄️ Generating database migrations..."
npm run db:generate

echo "✅ Build completed successfully!"
echo ""
echo "🎉 Social Affiliate Pro is ready to run!"
echo ""
echo "To start the application:"
echo "  Development: npm run dev"
echo "  Production: docker-compose up -d"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo "  LocalAI: http://localhost:8080"
echo "  Grafana: http://localhost:3001" 