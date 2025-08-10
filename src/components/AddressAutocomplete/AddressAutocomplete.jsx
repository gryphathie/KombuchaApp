import React, { useState, useEffect, useRef } from 'react';
import { loadGoogleMapsAPI } from '../../utils/loadGoogleMaps';
import './AddressAutocomplete.css';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Ingresa una dirección...",
  className = "",
  restrictedCities = [], // Array of city names to restrict search to
  restrictedStates = []  // Array of state names to restrict search to
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  useEffect(() => {
    // Initialize Google Maps services
    const initializeGoogleMaps = async () => {
      try {
        await loadGoogleMapsAPI();
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };

    initializeGoogleMaps();
  }, []);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const getAddressSuggestions = (input) => {
    if (!autocompleteService.current || input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    // Create multiple search requests with different strategies
    const searchRequests = [
      // Full address search
      {
        input: input,
        componentRestrictions: { country: 'mx' },
        types: ['address']
      },
      // Street search (more flexible)
      {
        input: input,
        componentRestrictions: { country: 'mx' },
        types: ['geocode']
      },
      // Establishments search (for landmarks, businesses)
      {
        input: input,
        componentRestrictions: { country: 'mx' },
        types: ['establishment']
      }
    ];

    // Execute all search requests
    const allPromises = searchRequests.map(request => {
      return new Promise((resolve) => {
        autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(predictions || []);
          } else {
            resolve([]);
          }
        });
      });
    });

    Promise.all(allPromises).then((results) => {
      // Combine and deduplicate results
      const allPredictions = results.flat();
      const uniquePredictions = allPredictions.filter((prediction, index, self) => 
        index === self.findIndex(p => p.place_id === prediction.place_id)
      );

      // Filter predictions based on restricted cities/states
      let filteredPredictions = uniquePredictions;
      
      if (restrictedCities.length > 0 || restrictedStates.length > 0) {
        filteredPredictions = uniquePredictions.filter(prediction => {
          const secondaryText = prediction.structured_formatting.secondary_text || '';
          const fullDescription = prediction.description || '';
          
          // Check if any restricted city is in the prediction
          const hasRestrictedCity = restrictedCities.length === 0 || 
            restrictedCities.some(city => 
              secondaryText.toLowerCase().includes(city.toLowerCase()) ||
              fullDescription.toLowerCase().includes(city.toLowerCase())
            );
          
          // Check if any restricted state is in the prediction
          const hasRestrictedState = restrictedStates.length === 0 ||
            restrictedStates.some(state => 
              secondaryText.toLowerCase().includes(state.toLowerCase()) ||
              fullDescription.toLowerCase().includes(state.toLowerCase())
            );
          
          return hasRestrictedCity && hasRestrictedState;
        });
      }

      // Sort predictions by relevance (exact matches first, then partial matches)
      filteredPredictions.sort((a, b) => {
        const aMainText = a.structured_formatting.main_text.toLowerCase();
        const bMainText = b.structured_formatting.main_text.toLowerCase();
        const inputLower = input.toLowerCase();
        
        const aExactMatch = aMainText.startsWith(inputLower);
        const bExactMatch = bMainText.startsWith(inputLower);
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        return aMainText.localeCompare(bMainText);
      });

      setSuggestions(filteredPredictions);
      setShowSuggestions(filteredPredictions.length > 0);
      setIsLoading(false);
    });
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange({ address: newValue, coordinates: null });

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce the search to avoid too many API calls
    const timeout = setTimeout(() => {
      getAddressSuggestions(newValue);
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Get place details to extract coordinates
    if (placesService.current) {
      placesService.current.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ['geometry', 'formatted_address']
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const coordinates = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };

            onChange({
              address: suggestion.description,
              coordinates: coordinates
            });
          }
        }
      );
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[0]);
    }
  };

  return (
    <div className={`address-autocomplete ${className}`}>
      <div className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="address-input"
          autoComplete="off"
        />
        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-container">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
            >
              <div className="suggestion-main-text">{suggestion.structured_formatting.main_text}</div>
              <div className="suggestion-secondary-text">{suggestion.structured_formatting.secondary_text}</div>
            </div>
          ))}
        </div>
      )}
      {showSuggestions && suggestions.length === 0 && !isLoading && inputValue.length > 2 && (
        <div className="no-suggestions">
          <div className="no-suggestions-text">No se encontraron direcciones</div>
          <div className="no-suggestions-hint">Intenta con términos más específicos</div>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete; 