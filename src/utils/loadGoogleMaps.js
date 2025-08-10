// Utility function to load Google Maps API dynamically
export const loadGoogleMapsAPI = () => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps already loaded');
      resolve(window.google.maps);
      return;
    }

    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      const error = 'Google Maps API key not found in environment variables. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.';
      console.error(error);
      reject(new Error(error));
      return;
    }

    console.log('Loading Google Maps API with key:', apiKey.substring(0, 10) + '...');

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Create a global callback function
    window.initGoogleMaps = () => {
      console.log('Google Maps API loaded successfully');
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps failed to initialize properly'));
      }
      // Clean up the global callback
      delete window.initGoogleMaps;
    };

    // Handle script load
    script.onload = () => {
      console.log('Google Maps script loaded');
      // The callback will handle the actual initialization
    };

    // Handle script error
    script.onerror = () => {
      const error = 'Failed to load Google Maps API script';
      console.error(error);
      reject(new Error(error));
    };

    // Add script to document
    document.head.appendChild(script);

    // Set a timeout in case the callback never fires
    setTimeout(() => {
      if (!window.google || !window.google.maps) {
        const error = 'Google Maps API loading timed out';
        console.error(error);
        reject(new Error(error));
      }
    }, 10000); // 10 second timeout
  });
}; 