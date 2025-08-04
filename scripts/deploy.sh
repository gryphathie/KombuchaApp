#!/bin/bash

# Deployment script for KombuchaApp
# Usage: ./scripts/deploy.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

echo "🚀 Deploying KombuchaApp to $ENVIRONMENT environment..."

case $ENVIRONMENT in
  "dev"|"development")
    echo "📦 Building for development..."
    npm run build:dev
    echo "🚀 Deploying to development environment..."
    npm run deploy:dev
    echo "✅ Development deployment complete!"
    echo "🌐 Your app will be available at: https://gabrielathie.github.io/KombuchaApp/dev/"
    ;;
  "prod"|"production")
    echo "📦 Building for production..."
    npm run build:prod
    echo "🚀 Deploying to production environment..."
    npm run deploy:prod
    echo "✅ Production deployment complete!"
    echo "🌐 Your app will be available at: https://gabrielathie.github.io/KombuchaApp/"
    ;;
  *)
    echo "❌ Invalid environment. Use 'dev' or 'prod'"
    echo "Usage: ./scripts/deploy.sh [dev|prod]"
    exit 1
    ;;
esac

echo "🎉 Deployment finished!" 