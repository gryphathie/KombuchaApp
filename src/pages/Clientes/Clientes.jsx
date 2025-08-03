import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getMexicoDate } from '../../utils/dateUtils';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import LocationRestrictions from '../../components/LocationRestrictions';
import AddressPreviewMap from '../../components/AddressPreviewMap';
import { getRestrictedCities, getRestrictedStates } from '../../config/locationConfig';
import './Clientes.css';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [sortField, setSortField] = useState('nombre');
  const [sortDirection, setSortDirection] = useState('asc');
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',    
    direccionCoords: null,
    fechaRegistro: '',
  });
  const [showMapPreview, setShowMapPreview] = useState(false);

  // Fetch clients from Firebase
  const fetchClientes = async () => {
    try {
      console.log('Fetching clients from Firebase...');
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      console.log('Firebase response:', querySnapshot);
      
      const clientesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Processed clients data:', clientesData);
      
      setClientes(clientesData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort clients based on current sort state
  const sortedClientes = [...clientes].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';

    // Handle date sorting
    if (sortField === 'fechaRegistro') {
      aValue = aValue || '1900-01-01';
      bValue = bValue || '1900-01-01';
    }

    // Convert to lowercase for string comparison
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle address autocomplete changes
  const handleAddressChange = (addressData) => {
    setFormData(prev => ({
      ...prev,
      direccion: addressData.address,
      direccionCoords: addressData.coordinates ? {
        lat: parseFloat(addressData.coordinates.lat),
        lng: parseFloat(addressData.coordinates.lng)
      } : null
    }));
  };

  // Handle showing map preview
  const handleShowMapPreview = () => {
    if (formData.direccionCoords && formData.direccion) {
      setShowMapPreview(true);
    }
  };

  // Handle closing map preview
  const handleCloseMapPreview = () => {
    setShowMapPreview(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const clienteData = {
        ...formData,
        fechaRegistro: formData.fechaRegistro || getMexicoDate()
      };


      
      // Remove direccionCoords from the main data if it's null
      if (!clienteData.direccionCoords) {
        delete clienteData.direccionCoords;
      }

      if (editingCliente) {
        // Update existing client
        await updateDoc(doc(db, 'clientes', editingCliente.id), clienteData);
        setEditingCliente(null);
      } else {
        // Add new client
        await addDoc(collection(db, 'clientes'), clienteData);
      }

      // Reset form and refresh data
      setFormData({
        nombre: '',        
        telefono: '',
        direccion: '',        
        direccionCoords: null,
      });
      setShowForm(false);
      fetchClientes();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  // Handle edit client
  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',      
      direccionCoords: cliente.direccionCoords ? {
        lat: parseFloat(cliente.direccionCoords.lat),
        lng: parseFloat(cliente.direccionCoords.lng)
      } : null,
    });
    setShowForm(true);
  };

  // Handle delete client
  const handleDelete = async (clienteId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await deleteDoc(doc(db, 'clientes', clienteId));
        fetchClientes();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingCliente(null);
    setFormData({
      nombre: '',
      telefono: '',
      direccion: '',      
      direccionCoords: null,
    });
  };

  if (loading) {
    return (
      <div className="clientes-page">
        <div className="loading">Cargando clientes...</div>
      </div>
    );
  }

  return (
    <div className="clientes-page">
      <div className="clientes-header">
        <h1>Gestión de Clientes</h1>
        <button 
          className="add-cliente-btn"
          onClick={() => setShowForm(true)}
        >
          + Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h2>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="direccion">Dirección</label>
                <LocationRestrictions showDetails={true} />
                <AddressAutocomplete
                  value={formData.direccion}
                  onChange={handleAddressChange}
                  placeholder="Ingresa la dirección del cliente..."
                  restrictedCities={getRestrictedCities()}
                  restrictedStates={getRestrictedStates()}
                />
                {formData.direccionCoords && (
                  <div className="coordinates-info">
                    <small>📍 Coordenadas guardadas: {formData.direccionCoords.lat.toFixed(6)}, {formData.direccionCoords.lng.toFixed(6)}</small>
                    <button 
                      type="button" 
                      className="preview-map-btn"
                      onClick={handleShowMapPreview}
                    >
                      🗺️ Ver en Mapa
                    </button>
                  </div>
                )}
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="cancel-btn">
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  {editingCliente ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="clientes-content">
        {clientes.length === 0 ? (
          <div className="empty-state">
            <p>No hay clientes registrados</p>
            <button 
              className="add-first-cliente-btn"
              onClick={() => setShowForm(true)}
            >
              Agregar primer cliente
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="clientes-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('nombre')}>
                    Nombre {getSortIndicator('nombre')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('telefono')}>
                    Teléfono {getSortIndicator('telefono')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('direccion')}>
                    Dirección {getSortIndicator('direccion')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('fechaRegistro')}>
                    Fecha de Registro {getSortIndicator('fechaRegistro')}
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedClientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.telefono || '-'}</td>
                    <td>{cliente.direccion || '-'}</td>
                    <td>{cliente.fechaRegistro || '-'}</td>
                    <td className="actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(cliente)}
                      >
                        Editar
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(cliente.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Address Preview Map */}
      {showMapPreview && (
        <AddressPreviewMap
          address={formData.direccion}
          coordinates={formData.direccionCoords}
          onClose={handleCloseMapPreview}
        />
      )}
    </div>
  );
}

export default Clientes;
