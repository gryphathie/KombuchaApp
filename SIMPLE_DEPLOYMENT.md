# Simple Deployment Guide

This is a simple approach using separate branches for development and production.

## Setup

### 1. Development Branch (develop)

- Use `src/firebase.dev.js` for Firebase configuration
- Deploy to: `https://gabrielathie.github.io/KombuchaApp/`

### 2. Production Branch (main)

- Use `src/firebase.js` for Firebase configuration
- Deploy to: `https://gabrielathie.github.io/KombuchaApp/`

## Workflow

### For Development:

1. Work on the `develop` branch
2. Use development Firebase project
3. Deploy with: `npm run deploy`

### For Production:

1. Merge `develop` to `main`
2. Use production Firebase project
3. Deploy with: `npm run deploy`

## Firebase Setup

### Development Firebase Project:

1. Create a new Firebase project for development
2. Copy the config to `src/firebase.dev.js`
3. Update the config values

### Production Firebase Project:

1. Use your existing Firebase project
2. Keep the config in `src/firebase.js`

## Deployment Commands

```bash
# Switch to development Firebase config
./scripts/switch-firebase.sh dev

# Switch to production Firebase config
./scripts/switch-firebase.sh prod

# Deploy from any branch
npm run deploy
```

## Branch Strategy

- **develop**: Development work with dev Firebase
- **main**: Production with production Firebase

This approach is simple and effective!
