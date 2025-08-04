// Environment configuration utility
export const getEnvironmentConfig = () => {
  const env = import.meta.env.VITE_APP_ENV || 'development'
  
  const config = {
    development: {
      title: 'KombuchaApp (Dev)',
      apiUrl: import.meta.env.VITE_API_URL || 'https://dev-api.example.com',
      firebaseConfig: {
        // Add your development Firebase config here
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY_DEV,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_DEV,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID_DEV,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_DEV,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_DEV,
        appId: import.meta.env.VITE_FIREBASE_APP_ID_DEV,
      },
      debug: true,
      logLevel: 'debug'
    },
    production: {
      title: 'KombuchaApp',
      apiUrl: import.meta.env.VITE_API_URL || 'https://api.example.com',
      firebaseConfig: {
        // Add your production Firebase config here
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY_PROD,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_PROD,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID_PROD,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_PROD,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_PROD,
        appId: import.meta.env.VITE_FIREBASE_APP_ID_PROD,
      },
      debug: false,
      logLevel: 'error'
    }
  }
  
  return config[env] || config.development
}

export const isDevelopment = () => {
  return import.meta.env.VITE_APP_ENV === 'development'
}

export const isProduction = () => {
  return import.meta.env.VITE_APP_ENV === 'production'
} 