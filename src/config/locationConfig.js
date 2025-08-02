// Configuration for location restrictions in address autocomplete
export const LOCATION_CONFIG = {
  // Cities where you want to restrict address searches
  // Add or remove cities as needed
  restrictedCities: [    
    'Puebla',
    'Cholula',
    'San Andrés Cholula',
    'San Pedro Cholula',
  ],
  
  // States where you want to restrict address searches
  // Add or remove states as needed
  restrictedStates: [    
    'Puebla',
  ],
  
  // Default center for maps (Mexico City)
  defaultMapCenter: {
    lat: 19.4326,
    lng: -99.1332
  },
  
  // Default zoom level for maps
  defaultZoom: 12,
  
  // Country restriction (ISO 3166-1 alpha-2 country code)
  country: 'mx'
};

// Helper function to get city restrictions
export const getRestrictedCities = () => LOCATION_CONFIG.restrictedCities;

// Helper function to get state restrictions  
export const getRestrictedStates = () => LOCATION_CONFIG.restrictedStates;

// Helper function to check if a location is within restrictions
export const isLocationAllowed = (addressText) => {
  const text = addressText.toLowerCase();
  
  // If no restrictions, allow all locations
  if (LOCATION_CONFIG.restrictedCities.length === 0 && LOCATION_CONFIG.restrictedStates.length === 0) {
    return true;
  }
  
  // Check if any restricted city is in the address
  const hasRestrictedCity = LOCATION_CONFIG.restrictedCities.length === 0 ||
    LOCATION_CONFIG.restrictedCities.some(city => 
      text.includes(city.toLowerCase())
    );
  
  // Check if any restricted state is in the address
  const hasRestrictedState = LOCATION_CONFIG.restrictedStates.length === 0 ||
    LOCATION_CONFIG.restrictedStates.some(state => 
      text.includes(state.toLowerCase())
    );
  
  return hasRestrictedCity && hasRestrictedState;
}; 