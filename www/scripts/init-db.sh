#!/bin/bash

# Exit on any error
set -e

echo "🗄️  Initializing database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Check if we're in development or production mode
if [ "$NODE_ENV" = "production" ]; then
    echo "🚀 Production mode: Running migrations..."
    npx prisma migrate deploy
else
    echo "🔧 Development mode: Pushing schema..."
    npx prisma db push
fi

echo "✅ Database initialization completed!" 