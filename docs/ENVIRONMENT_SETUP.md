# Environment Variables Setup

This document explains how to set up environment variables for the Kombucha App to keep API keys secure.

## What Was Changed

### 1. Created Environment Files

- **`.env`**: Contains your actual API keys (not committed to git)
- **`.env.example`**: Template file showing required environment variables

### 2. Updated Firebase Configuration

- Modified `src/firebase.js` to use environment variables
- Modified `src/firebase.dev.js` to use environment variables
- All Firebase config values now come from `import.meta.env.VITE_*`

### 3. Updated Google Maps Integration

- Removed hardcoded API key from `index.html`
- Created `src/utils/loadGoogleMaps.js` utility function
- Updated all map components to use dynamic loading:
  - `AddressAutocomplete`
  - `AddressPreviewMap`
  - `MapView`

### 4. Updated Documentation

- Added environment variables section to `README.md`
- Updated installation instructions

## Environment Variables

### Required Variables

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### How to Get These Values

1. **Firebase Configuration**:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Copy the config values

2. **Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API and Places API
   - Create credentials (API key)
   - Restrict the key to your domain for security

## Security Benefits

1. **No API Keys in Code**: All sensitive data is now in environment variables
2. **Git Ignored**: The `.env` file is in `.gitignore` and won't be committed
3. **Template Available**: `.env.example` shows what variables are needed
4. **Dynamic Loading**: Google Maps API is loaded dynamically with the environment key

## Development Workflow

1. Copy `.env.example` to `.env`
2. Fill in your actual API keys in `.env`
3. Never commit `.env` to version control
4. Share `.env.example` with other developers

## Deployment

For deployment platforms like GitHub Pages, you'll need to:

1. Set environment variables in your deployment platform
2. Ensure the build process can access these variables
3. Consider using different API keys for development vs production

## Troubleshooting

- **Build Errors**: Make sure all environment variables are set
- **Maps Not Loading**: Check that `VITE_GOOGLE_MAPS_API_KEY` is correct
- **Firebase Errors**: Verify all Firebase environment variables are set correctly
