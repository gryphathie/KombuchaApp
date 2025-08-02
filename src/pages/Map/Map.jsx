import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import MapView from '../../components/MapView';
import './Map.css';

function Map() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch clients from Firebase
  const fetchClientes = async () => {
    try {
      console.log('Fetching clients for map...');
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      
      const clientesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Clients with coordinates:', clientesData.filter(c => {
        const lat = parseFloat(c.direccionCoords?.lat);
        const lng = parseFloat(c.direccionCoords?.lng);
        return c.direccionCoords && !isNaN(lat) && !isNaN(lng);
      }));
      setClientes(clientesData);
    } catch (error) {
      console.error('Error fetching clients for map:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);



  if (loading) {
    return (
      <div className="map-page">
        <div className="loading">Cargando mapa de clientes...</div>
      </div>
    );
  }

  const clientsWithCoordinates = clientes.filter(c => {
    const lat = parseFloat(c.direccionCoords?.lat);
    const lng = parseFloat(c.direccionCoords?.lng);
    return c.direccionCoords && !isNaN(lat) && !isNaN(lng);
  });

  return (
    <div className="map-page">
      <div className="map-header">
        <h1>Mapa de Clientes</h1>
        <div className="map-stats">
          <span className="stat-item">
            <strong>Total de clientes:</strong> {clientes.length}
          </span>
          <span className="stat-item">
            <strong>Con coordenadas:</strong> {clientsWithCoordinates.length}
          </span>
        </div>

      </div>
      
      {clientsWithCoordinates.length === 0 ? (
        <div className="no-coordinates-message">
          <div className="message-content">
            <h2>No hay clientes con coordenadas</h2>
            <p>
              Para ver clientes en el mapa, necesitas agregar direcciones usando 
              las sugerencias de Google Maps en la página de gestión de clientes.
            </p>
            <button 
              className="go-to-clients-btn"
              onClick={() => window.location.href = '/clientes'}
            >
              Ir a Gestión de Clientes
            </button>
          </div>
        </div>
      ) : (
        <MapView clientes={clientes} />
      )}
    </div>
  );
}

export default Map; 