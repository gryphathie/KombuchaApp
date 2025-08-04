# Kombucha App 🍵

A modern web application for tracking your kombucha brewing process. Built with React, Firebase, and deployed on GitHub Pages.

## Features

- 📊 **Dashboard**: Track your brewing batches and progress
- 📝 **Brewing Guide**: Step-by-step instructions for perfect kombucha
- 📱 **Mobile Responsive**: Works great on phones and desktop
- 🔥 **Firebase Integration**: Real-time data storage and authentication
- 🚀 **GitHub Pages**: Free hosting and automatic deployments

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: CSS3 with modern design
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Maps**: Google Maps API
- **Hosting**: GitHub Pages
- **Routing**: React Router DOM

## Environment Variables

This project uses environment variables to keep API keys secure. Create a `.env` file in the root directory with the following variables:

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

**Security Note**: The `.env` file is already in `.gitignore` and will not be committed to the repository.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/gabrielathie/KombuchaApp.git
cd KombuchaApp
```

2. Install dependencies:

```bash
npm install
```

3. Set up Environment Variables:

   Create a `.env` file in the root directory with your API keys:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your actual API keys:

   - **Firebase**: Get your config from [Firebase Console](https://console.firebase.google.com/)
   - **Google Maps**: Get your API key from [Google Cloud Console](https://console.cloud.google.com/)

   **Important**: Never commit your `.env` file to version control!

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

This project uses a simple branch-based deployment strategy.

### Environments

- **Development**: Work on `develop` branch with development Firebase
- **Production**: Work on `main` branch with production Firebase

### Deployment

```bash
npm run deploy
```

### Workflow

1. **Development**: Work on `develop` branch → Deploy to GitHub Pages
2. **Production**: Merge to `main` branch → Deploy to GitHub Pages

For detailed information, see [SIMPLE_DEPLOYMENT.md](./SIMPLE_DEPLOYMENT.md).

### Firebase Hosting (Alternative)

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Initialize Firebase:

```bash
firebase init hosting
```

3. Build and deploy:

```bash
npm run build
firebase deploy
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── firebase.js    # Firebase configuration
├── App.jsx        # Main app component
└── main.jsx       # App entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you have any questions or need help, please open an issue on GitHub.
