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
- **Hosting**: GitHub Pages
- **Routing**: React Router DOM

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

3. Set up Firebase:

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database and Authentication
   - Copy your Firebase config to `src/firebase.js`

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

### GitHub Pages

1. Push your code to GitHub
2. Run the deployment command:

```bash
npm run deploy
```

3. Your app will be available at: `https://gabrielathie.github.io/KombuchaApp`

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
