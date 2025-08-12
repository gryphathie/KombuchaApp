// Singleton to track loading state
let isLoading = false;
let loadPromise = null;

// Utility function to load Google Maps API dynamically
export const loadGoogleMapsAPI = () => {
  // If already loading, return the existing promise
  if (isLoading && loadPromise) {
    console.log('Google Maps already loading, returning existing promise');
    return loadPromise;
  }

  // If already loaded, return resolved promise
  if (window.google && window.google.maps) {
    console.log('Google Maps already loaded');
    return Promise.resolve(window.google.maps);
  }

  // Start loading
  isLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    console.log('loadGoogleMapsAPI called');
    console.log('Environment variables:', {
      VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    });
    
    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      const error = 'Google Maps API key not found in environment variables. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.';
      console.error(error);
      isLoading = false;
      loadPromise = null;
      reject(new Error(error));
      return;
    }

    console.log('Loading Google Maps API with key:', apiKey.substring(0, 10) + '...');

    // Create a unique callback name to avoid conflicts
    const callbackName = 'initGoogleMaps_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Define the global callback function BEFORE creating the script
    window[callbackName] = () => {
      console.log('Google Maps API loaded successfully via callback:', callbackName);
      isLoading = false;
      loadPromise = null;
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps failed to initialize properly'));
      }
      // Clean up the global callback
      delete window[callbackName];
    };

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    console.log('Script URL:', script.src);

    // Handle script load
    script.onload = () => {
      console.log('Google Maps script loaded');
      // The callback will handle the actual initialization
    };

    // Handle script error
    script.onerror = () => {
      const error = 'Failed to load Google Maps API script';
      console.error(error);
      isLoading = false;
      loadPromise = null;
      // Clean up the callback if script fails
      delete window[callbackName];
      reject(new Error(error));
    };

    // Add script to document
    document.head.appendChild(script);
    console.log('Script added to document head');

    // Small delay to ensure callback is fully defined before script executes
    setTimeout(() => {
      console.log('Callback function should be ready:', typeof window[callbackName]);
    }, 100);

    // Set a timeout in case the callback never fires
    const timeoutId = setTimeout(() => {
      if (!window.google || !window.google.maps) {
        const error = 'Google Maps API loading timed out';
        console.error(error);
        isLoading = false;
        loadPromise = null;
        // Clean up the callback if timeout occurs
        delete window[callbackName];
        reject(new Error(error));
      }
    }, 10000); // 10 second timeout

    // Clean up timeout if promise resolves or rejects
    const originalResolve = resolve;
    const originalReject = reject;
    
    resolve = (value) => {
      clearTimeout(timeoutId);
      originalResolve(value);
    };
    
    reject = (error) => {
      clearTimeout(timeoutId);
      originalReject(error);
    };
  });

  return loadPromise;
}; 