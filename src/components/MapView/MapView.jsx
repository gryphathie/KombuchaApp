import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsAPI } from '../../utils/loadGoogleMaps';
import { LOCATION_CONFIG } from '../../config/locationConfig';
import './MapView.css';

const MapView = ({ clientes = [], center = null, zoom = 12 }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const [markerData, setMarkerData] = useState([]);

  // Function to focus map on a specific client location
  const focusOnClient = (coordinates, clients, isGrouped) => {
    if (!mapInstanceRef.current) return;
    
    if (isGrouped) {
      // For grouped clients, center on the group location
      mapInstanceRef.current.setCenter(coordinates);
      mapInstanceRef.current.setZoom(16); // Zoom in closer for grouped locations
    } else {
      // For single clients, center on their exact location
      mapInstanceRef.current.setCenter(coordinates);
      mapInstanceRef.current.setZoom(17); // Zoom in even closer for single clients
    }
  };

  // Function to group clients by coordinates
  const groupClientsByCoordinates = (clientes) => {
    const groups = {};
    
    clientes.forEach(cliente => {
      const lat = parseFloat(cliente.direccionCoords?.lat);
      const lng = parseFloat(cliente.direccionCoords?.lng);
      
      if (cliente.direccionCoords && !isNaN(lat) && !isNaN(lng)) {
        // Round coordinates to 6 decimal places to group very close locations
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        
        if (!groups[key]) {
          groups[key] = {
            coordinates: { lat, lng },
            clients: []
          };
        }
        groups[key].clients.push(cliente);
      }
    });
    
    return groups;
  };

  // Function to calculate offset for overlapping markers
  const calculateMarkerOffset = (index, totalMarkers, baseOffset = 0.0001) => {
    if (totalMarkers <= 1) return { lat: 0, lng: 0 };
    
    // Create a spiral pattern for offsetting markers
    const angle = (index * 2 * Math.PI) / totalMarkers;
    const radius = baseOffset * (1 + Math.floor(index / 8)); // Increase radius for more markers
    
    return {
      lat: Math.cos(angle) * radius,
      lng: Math.sin(angle) * radius
    };
  };

  // Function to create info window content for multiple clients
  const createInfoWindowContent = (clients) => {
    if (clients.length === 1) {
      const cliente = clients[0];
      return `
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
      `;
    }
    
    // Multiple clients at same location
    const clientsList = clients.map((cliente, idx) => `
      <div style="border-bottom: 1px solid #eee; padding: 8px 0; ${idx === clients.length - 1 ? 'border-bottom: none;' : ''}">
        <h4 style="margin: 0 0 5px 0; color: #333; font-size: 14px;">${cliente.nombre}</h4>
        <p style="margin: 2px 0; color: #666; font-size: 12px;">
          <strong>Teléfono:</strong> ${cliente.telefono || 'No disponible'}
        </p>
        <p style="margin: 2px 0; color: #666; font-size: 12px;">
          <strong>Dirección:</strong> ${cliente.direccion || 'No disponible'}
        </p>
      </div>
    `).join('');
    
    return `
      <div style="padding: 10px; min-width: 250px; max-height: 300px; overflow-y: auto;">
        <h3 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #F54927; padding-bottom: 5px;">
          ${clients.length} Cliente${clients.length > 1 ? 's' : ''} en esta ubicación
        </h3>
        ${clientsList}
      </div>
    `;
  };

  useEffect(() => {
    // Initialize map when component mounts
    const initializeMap = async () => {
      try {
        await loadGoogleMapsAPI();
        if (mapRef.current) {
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
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };

    initializeMap();
  }, [center, zoom]);

  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach(markerData => {
      markerData.marker.setMap(null);
      markerData.infoWindow.close();
    });
    markersRef.current = [];

    // Add markers for clients with coordinates
    const addMarkers = async () => {
      try {
        await loadGoogleMapsAPI();
        if (mapInstanceRef.current && clientes.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidMarkers = false;

        // Group clients by coordinates
        const coordinateGroups = groupClientsByCoordinates(clientes);
        let markerIndex = 1;
        
        Object.values(coordinateGroups).forEach((group, groupIndex) => {
          const { coordinates, clients } = group;
          
          clients.forEach((cliente, clientIndex) => {
            // Calculate offset for overlapping markers
            const offset = calculateMarkerOffset(clientIndex, clients.length);
            const markerPosition = {
              lat: coordinates.lat + offset.lat,
              lng: coordinates.lng + offset.lng
            };
            
            const marker = new window.google.maps.Marker({
              position: markerPosition,
              map: mapInstanceRef.current,
              title: clients.length > 1 ? `${clients.length} clientes en esta ubicación` : cliente.nombre,
              label: {
                text: markerIndex.toString(),
                color: 'white',
                fontWeight: 'bold'
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: clients.length > 1 ? 14 : 10, // Larger for grouped markers
                fillColor: clients.length > 1 ? '#8B5CF6' : '#F54927', // Purple for grouped, red for single
                fillOpacity: 1,
                strokeColor: clients.length > 1 ? '#4C1D95' : '#ffffff', // Darker purple border for grouped
                strokeWeight: clients.length > 1 ? 3 : 2 // Thicker border for grouped markers
              }
            });

            // Add info window for all clients at this location
            const infoWindow = new window.google.maps.InfoWindow({
              content: createInfoWindowContent(clients)
            });

            marker.addListener('click', () => {
              infoWindow.open(mapInstanceRef.current, marker);
            });

            // Store marker and info window references for legend interaction
            markersRef.current.push({
              marker: marker,
              infoWindow: infoWindow,
              coordinates: coordinates,
              clients: clients,
              isGrouped: clients.length > 1,
              markerNumber: markerIndex
            });

            bounds.extend(markerPosition);
            hasValidMarkers = true;
            
            // Increment marker index for next marker
            markerIndex++;
          });
        });

        // Store marker data in state for legend access
        setMarkerData([...markersRef.current]);

      // Fit map to show all markers
      if (hasValidMarkers) {
        mapInstanceRef.current.fitBounds(bounds);
        
        // Add some padding to the bounds
        const listener = window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
          mapInstanceRef.current.setZoom(Math.min(mapInstanceRef.current.getZoom(), 15));
        });
      }
        }
      } catch (error) {
        console.error('Failed to load Google Maps for markers:', error);
      }
    };

    addMarkers();
  }, [clientes]);

  return (
    <div className="map-view">
      <div ref={mapRef} className="map-container" />
      <div className="map-legend">
        <h3>Clientes en el mapa</h3>
        <div className="legend-items">
          {(() => {
            const coordinateGroups = groupClientsByCoordinates(clientes);
            
            return Object.values(coordinateGroups).map((group, groupIndex) => {
              const { coordinates, clients } = group;
              const isGrouped = clients.length > 1;
              
              if (isGrouped) {
                // For grouped clients, show each client individually
                return clients.map((cliente, clientIndex) => {
                  // Find the corresponding marker data to get the correct number
                  const markerDataItem = markerData.find(m => 
                    m.coordinates.lat === coordinates.lat && 
                    m.coordinates.lng === coordinates.lng && 
                    m.clients.includes(cliente)
                  );
                  
                  return (
                    <div 
                      key={`${groupIndex}-${clientIndex}`} 
                      className="legend-item"
                      onClick={() => focusOnClient(coordinates, clients, true)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div 
                        className="legend-marker" 
                        style={{ 
                          backgroundColor: '#8B5CF6',
                          position: 'relative'
                        }}
                      >
                        {clients.length}
                        <div 
                          style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            backgroundColor: '#4C1D95',
                            color: 'white',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white'
                          }}
                        >
                          {markerDataItem ? markerDataItem.markerNumber : '?'}
                        </div>
                      </div>
                      <span className="legend-text">
                        {cliente.nombre}
                      </span>
                    </div>
                  );
                });
              } else {
                // For single clients, show normally
                const markerDataItem = markerData.find(m => 
                  m.coordinates.lat === coordinates.lat && 
                  m.coordinates.lng === coordinates.lng
                );
                
                return (
                  <div 
                    key={`group-${groupIndex}`} 
                    className="legend-item"
                    onClick={() => focusOnClient(coordinates, clients, false)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div 
                      className="legend-marker" 
                      style={{ 
                        backgroundColor: '#F54927'
                      }}
                    >
                      {markerDataItem ? markerDataItem.markerNumber : '?'}
                    </div>
                    <span className="legend-text">
                      {clients[0].nombre}
                    </span>
                  </div>
                );
              }
            });
          })()}
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