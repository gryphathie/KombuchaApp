import React, { useEffect, useRef } from 'react';
import { LOCATION_CONFIG } from '../../config/locationConfig';
import './MapView.css';

const MapView = ({ clientes = [], center = null, zoom = 12 }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Initialize map when component mounts
    if (window.google && window.google.maps && mapRef.current) {
      const defaultCenter = center || LOCATION_CONFIG.defaultMapCenter;
      
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: zoom || LOCATION_CONFIG.defaultZoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
    }
  }, [center, zoom]);

  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

          // Add markers for clients with coordinates
      if (mapInstanceRef.current && clientes.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidMarkers = false;

        clientes.forEach((cliente, index) => {
          // Convert coordinates to numbers if they're strings
          const lat = parseFloat(cliente.direccionCoords?.lat);
          const lng = parseFloat(cliente.direccionCoords?.lng);
          
          if (cliente.direccionCoords && !isNaN(lat) && !isNaN(lng)) {
          const marker = new window.google.maps.Marker({
            position: {
              lat: lat,
              lng: lng
            },
            map: mapInstanceRef.current,
            title: cliente.nombre,
            label: {
              text: (index + 1).toString(),
              color: 'white',
              fontWeight: 'bold'
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#F54927',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });

          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #333;">${cliente.nombre}</h3>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Teléfono:</strong> ${cliente.telefono || 'No disponible'}
                </p>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Dirección:</strong> ${cliente.direccion || 'No disponible'}
                </p>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Registro:</strong> ${cliente.fechaRegistro || 'No disponible'}
                </p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
          });

          markersRef.current.push(marker);
          bounds.extend(marker.getPosition());
          hasValidMarkers = true;
        }
      });

      // Fit map to show all markers
      if (hasValidMarkers) {
        mapInstanceRef.current.fitBounds(bounds);
        
        // Add some padding to the bounds
        const listener = window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
          mapInstanceRef.current.setZoom(Math.min(mapInstanceRef.current.getZoom(), 15));
        });
      }
    }
  }, [clientes]);

  return (
    <div className="map-view">
      <div ref={mapRef} className="map-container" />
      <div className="map-legend">
        <h3>Clientes en el mapa</h3>
        <div className="legend-items">
          {clientes.map((cliente, index) => {
            const lat = parseFloat(cliente.direccionCoords?.lat);
            const lng = parseFloat(cliente.direccionCoords?.lng);
            return cliente.direccionCoords && !isNaN(lat) && !isNaN(lng) ? (
              <div key={cliente.id} className="legend-item">
                <div className="legend-marker" style={{ backgroundColor: '#F54927' }}>
                  {index + 1}
                </div>
                <span className="legend-text">{cliente.nombre}</span>
              </div>
            ) : null;
          })}
        </div>
        {clientes.filter(c => {
          const lat = parseFloat(c.direccionCoords?.lat);
          const lng = parseFloat(c.direccionCoords?.lng);
          return c.direccionCoords && !isNaN(lat) && !isNaN(lng);
        }).length === 0 && (
          <p className="no-coordinates">No hay clientes con coordenadas para mostrar en el mapa</p>
        )}
      </div>
    </div>
  );
};

export default MapView; 