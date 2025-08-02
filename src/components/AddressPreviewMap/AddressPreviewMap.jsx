import React, { useEffect, useRef } from 'react';
import './AddressPreviewMap.css';

const AddressPreviewMap = ({ address, coordinates, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Initialize map when component mounts
    if (window.google && window.google.maps && mapRef.current && coordinates) {
      const center = {
        lat: parseFloat(coordinates.lat),
        lng: parseFloat(coordinates.lng)
      };
      
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: 16,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Add marker for the address
      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapInstanceRef.current,
        title: address,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#F54927',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">📍 Dirección Seleccionada</h3>
            <p style="margin: 8px 0; color: #666; line-height: 1.4;">
              <strong>Dirección:</strong><br>
              ${address}
            </p>
            <p style="margin: 8px 0; color: #666; font-size: 12px;">
              <strong>Coordenadas:</strong><br>
              ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}
            </p>
          </div>
        `
      });

      // Show info window by default
      infoWindow.open(mapInstanceRef.current, markerRef.current);

      // Add click listener to marker
      markerRef.current.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, markerRef.current);
      });
    }
  }, [address, coordinates]);

  if (!coordinates) {
    return null;
  }

  return (
    <div className="address-preview-overlay">
      <div className="address-preview-container">
        <div className="address-preview-header">
          <h3>Vista Previa de la Dirección</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="address-preview-content">
          <div className="address-info">
            <p><strong>Dirección:</strong> {address}</p>
            <p><strong>Coordenadas:</strong> {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</p>
          </div>
          
          <div className="map-preview-container">
            <div ref={mapRef} className="map-preview" />
          </div>
        </div>
        
        <div className="address-preview-actions">
          <button className="confirm-btn" onClick={onClose}>
            Confirmar Dirección
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressPreviewMap; 