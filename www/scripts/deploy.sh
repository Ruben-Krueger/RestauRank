#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment process..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🗄️  Generating Prisma client..."
npx prisma generate

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🏗️  Building application..."
npm run build

echo "✅ Deployment completed successfully!"
echo "🚀 Starting the application..."
npm start 