#!/bin/bash

# Switch Firebase configuration between development and production
# Usage: ./scripts/switch-firebase.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

case $ENVIRONMENT in
  "dev"|"development")
    echo "🔄 Switching to development Firebase configuration..."
    
    # Backup current firebase.js
    cp src/firebase.js src/firebase.prod.js
    
    # Copy development config to main firebase.js
    cp src/firebase.dev.js src/firebase.js
    
    echo "✅ Switched to development Firebase configuration"
    echo "📝 Remember to update src/firebase.dev.js with your development Firebase project details"
    ;;
  "prod"|"production")
    echo "🔄 Switching to production Firebase configuration..."
    
    # Restore production config
    if [ -f src/firebase.prod.js ]; then
      cp src/firebase.prod.js src/firebase.js
      echo "✅ Switched to production Firebase configuration"
    else
      echo "❌ Production configuration not found. Please set up your production Firebase config in src/firebase.js"
    fi
    ;;
  *)
    echo "❌ Invalid environment. Use 'dev' or 'prod'"
    echo "Usage: ./scripts/switch-firebase.sh [dev|prod]"
    exit 1
    ;;
esac

echo ""
echo "🚀 Next steps:"
echo "1. Update Firebase configuration if needed"
echo "2. Deploy with: npm run deploy" 