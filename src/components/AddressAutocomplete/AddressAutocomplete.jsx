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

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange({ address: newValue, coordinates: null });

    if (newValue.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: newValue,
          componentRestrictions: { country: 'mx' }, // Restrict to Mexico
          types: ['address']
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            // Filter predictions based on restricted cities/states
            let filteredPredictions = predictions;
            
            if (restrictedCities.length > 0 || restrictedStates.length > 0) {
              filteredPredictions = predictions.filter(prediction => {
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
            
            setSuggestions(filteredPredictions);
            setShowSuggestions(filteredPredictions.length > 0);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
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

  return (
    <div className={`address-autocomplete ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className="address-input"
        autoComplete="off"
      />
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
    </div>
  );
};

export default AddressAutocomplete; 