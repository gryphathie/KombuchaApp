import React from 'react';
import { LOCATION_CONFIG } from '../../config/locationConfig';
import './LocationRestrictions.css';

const LocationRestrictions = ({ showDetails = false }) => {
  const hasRestrictions = LOCATION_CONFIG.restrictedCities.length > 0 || LOCATION_CONFIG.restrictedStates.length > 0;

  if (!hasRestrictions) {
    return null;
  }

  return (
    <div className="location-restrictions">
      <div className="restrictions-header">
        <span className="restrictions-icon">📍</span>
        <span className="restrictions-text">
          Búsqueda limitada a ubicaciones específicas
        </span>
      </div>
      
      {showDetails && (
        <div className="restrictions-details">
          {LOCATION_CONFIG.restrictedCities.length > 0 && (
            <div className="restriction-group">
              <strong>Ciudades permitidas:</strong>
              <div className="restriction-tags">
                {LOCATION_CONFIG.restrictedCities.map((city, index) => (
                  <span key={index} className="restriction-tag city-tag">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {LOCATION_CONFIG.restrictedStates.length > 0 && (
            <div className="restriction-group">
              <strong>Estados permitidos:</strong>
              <div className="restriction-tags">
                {LOCATION_CONFIG.restrictedStates.map((state, index) => (
                  <span key={index} className="restriction-tag state-tag">
                    {state}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationRestrictions; 