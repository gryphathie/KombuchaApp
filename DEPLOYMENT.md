# Deployment Guide

This project supports multiple deployment environments for development and production.

## Environments

### Development Environment

- **URL**: `https://gabrielathie.github.io/KombuchaApp/dev/`
- **Branch**: `gh-pages-dev`
- **Purpose**: Testing new features and development work
- **Deployment**: Automatic on push to `develop` branch

### Production Environment

- **URL**: `https://gabrielathie.github.io/KombuchaApp/`
- **Branch**: `gh-pages`
- **Purpose**: Live application for end users
- **Deployment**: Automatic on push to `main` branch

## Manual Deployment

### Deploy to Development

```bash
npm run deploy:dev
```

### Deploy to Production

```bash
npm run deploy:prod
```

## Environment Variables

### Development (.env.development)

```
VITE_APP_ENV=development
VITE_APP_TITLE=KombuchaApp (Dev)
VITE_API_URL=https://dev-api.example.com
VITE_FIREBASE_CONFIG_DEV=true
```

### Production (.env.production)

```
VITE_APP_ENV=production
VITE_APP_TITLE=KombuchaApp
VITE_API_URL=https://api.example.com
VITE_FIREBASE_CONFIG_PROD=true
```

## GitHub Pages Setup

1. Go to your repository settings
2. Navigate to "Pages" section
3. Set source to "Deploy from a branch"
4. Select `gh-pages` branch for production
5. For development, you can create a custom domain or use the `/dev/` path

## Workflow

1. **Development**: Work on the `develop` branch

   - Push changes to `develop` → Automatic deployment to dev environment
   - Test features in development environment

2. **Production**: Merge `develop` to `main`
   - Push changes to `main` → Automatic deployment to production environment
   - Production environment goes live

## Environment Detection in Code

```javascript
import {
  getEnvironmentConfig,
  isDevelopment,
  isProduction,
} from "./config/envConfig.js";

const config = getEnvironmentConfig();
console.log("Current environment:", config.title);

if (isDevelopment()) {
  console.log("Running in development mode");
}

if (isProduction()) {
  console.log("Running in production mode");
}
```

## Firebase Configuration

For different Firebase projects, add your environment-specific Firebase config variables to the respective `.env` files:

### Development

```
VITE_FIREBASE_API_KEY_DEV=your_dev_api_key
VITE_FIREBASE_AUTH_DOMAIN_DEV=your_dev_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID_DEV=your_dev_project_id
# ... other Firebase config
```

### Production

```
VITE_FIREBASE_API_KEY_PROD=your_prod_api_key
VITE_FIREBASE_AUTH_DOMAIN_PROD=your_prod_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID_PROD=your_prod_project_id
# ... other Firebase config
```
