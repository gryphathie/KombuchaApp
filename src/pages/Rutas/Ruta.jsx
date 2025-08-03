import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getMexicoDate } from '../../utils/dateUtils';
import MapView from '../../components/MapView';
import './Ruta.css';

const Ruta = () => {
  const [rutas, setRutas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRuta, setEditingRuta] = useState(null);
  const [sortField, setSortField] = useState('nombre');
  const [sortDirection, setSortDirection] = useState('asc');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedClientes, setSelectedClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [selectedRouteForMap, setSelectedRouteForMap] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    notas: '',
    clientes: []
  });

  // Fetch routes from Firebase
  const fetchRutas = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'rutas'));
      const rutasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRutas(rutasData);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setError('Error al cargar las rutas');
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients from Firebase
  const fetchClientes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      const clientesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientes(clientesData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchRutas();
    fetchClientes();
  }, []);

  // Handle sorting
  const handleSort = (field) => {
    setSortField(field);
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const getSortIndicator = (field) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? '▲' : '▼';
    }
    return '';
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle client selection
  const handleClienteSelection = (clienteId) => {
    setSelectedClientes(prev => {
      if (prev.includes(clienteId)) {
        return prev.filter(id => id !== clienteId);
      } else {
        return [...prev, clienteId];
      }
    });
  };

  // Filter clients based on search term
  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.direccion.toLowerCase().includes(searchTerm.toLowerCase())
  );



  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError('El nombre de la ruta es requerido');
      return;
    }

    if (selectedClientes.length === 0) {
      setError('Debe seleccionar al menos un cliente');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const rutaData = {
        ...formData,
        clientes: selectedClientes,
        fechaCreacion: getMexicoDate()
      };

      if (editingRuta) {
        await updateDoc(doc(db, 'rutas', editingRuta.id), rutaData);
      } else {
        await addDoc(collection(db, 'rutas'), rutaData);
      }

      setShowForm(false);
      setEditingRuta(null);
      resetForm();
      fetchRutas();
    } catch (error) {
      console.error('Error saving route:', error);
      setError('Error al guardar la ruta');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (ruta) => {
    setEditingRuta(ruta);
    setFormData({
      nombre: ruta.nombre,
      notas: ruta.notas || '',
      clientes: ruta.clientes || []
    });
    setSelectedClientes(ruta.clientes || []);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (rutaId) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta ruta?')) {
      try {
        await deleteDoc(doc(db, 'rutas', rutaId));
        fetchRutas();
      } catch (error) {
        console.error('Error deleting route:', error);
        setError('Error al eliminar la ruta');
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingRuta(null);
    resetForm();
  };

  // Handle view route map
  const handleViewRouteMap = (ruta) => {
    setSelectedRouteForMap(ruta);
    setShowRouteMap(true);
  };

  // Handle close route map
  const handleCloseRouteMap = () => {
    setShowRouteMap(false);
    setSelectedRouteForMap(null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nombre: '',
      notas: '',
      clientes: []
    });
    setSelectedClientes([]);
    setSearchTerm('');
    setError('');
  };

  // Get client name by ID
  const getClienteName = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  // Get client address by ID
  const getClienteAddress = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.direccion : 'Dirección no encontrada';
  };

  // Sort routes
  const sortedRutas = [...rutas].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';

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

  if (loading) {
    return <div className="loading">Cargando rutas...</div>;
  }

  return (
    <div className="ruta-page">
      <div className="ruta-header">
        <h1>Gestión de Rutas de Entrega</h1>
        <button 
          className="add-ruta-btn"
          onClick={() => setShowForm(true)}
        >
          Crear Nueva Ruta
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h2>{editingRuta ? 'Editar Ruta' : 'Crear Nueva Ruta'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre de la Ruta *</label>
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
                <label htmlFor="notas">Notas</label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="clientes-selection">
                <h3>Seleccionar Clientes</h3>
                
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="clientes-list">
                  {filteredClientes.map(cliente => (
                    <div 
                      key={cliente.id} 
                      className={`cliente-item ${selectedClientes.includes(cliente.id) ? 'selected' : ''}`}
                      onClick={() => handleClienteSelection(cliente.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedClientes.includes(cliente.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleClienteSelection(cliente.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="cliente-info">
                        <strong>{cliente.nombre}</strong>
                        <span>{cliente.direccion}</span>
                      </div>
                    </div>
                  ))}
                </div>

                                 {selectedClientes.length > 0 && (
                   <div className="selected-clients">
                     <h4>Clientes Seleccionados ({selectedClientes.length})</h4>
                     <div className="selected-list">
                       {selectedClientes.map((clienteId, index) => (
                         <div key={clienteId} className="ordered-client">
                           <span className="order-number">{index + 1}</span>
                           <span>{getClienteName(clienteId)}</span>
                           <span className="address">{getClienteAddress(clienteId)}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Map View for Selected Clients */}
                 {selectedClientes.length > 0 && (
                   <div className="map-section">
                     <h4>Vista del Mapa</h4>
                     {(() => {
                       const clientsWithCoords = selectedClientes.map(clienteId => {
                         const cliente = clientes.find(c => c.id === clienteId);
                         return cliente;
                       }).filter(cliente => cliente && cliente.direccionCoords);
                       
                       return clientsWithCoords.length > 0 ? (
                         <div className="map-container">
                           <MapView clientes={clientsWithCoords} />
                         </div>
                       ) : (
                         <div className="no-coordinates-message">
                           <p>Los clientes seleccionados no tienen coordenadas de ubicación configuradas.</p>
                           <p>Para ver la ubicación en el mapa, asegúrate de que los clientes tengan su dirección configurada correctamente.</p>
                         </div>
                       );
                     })()}
                   </div>
                 )}
              </div>

                             <div className="form-actions">
                 <button 
                   type="button" 
                   className="cancel-btn"
                   onClick={handleCancel}
                 >
                   Cancelar
                 </button>
                 <button 
                   type="submit" 
                   className="save-btn"
                   disabled={submitting}
                 >
                   {submitting ? 'Guardando...' : (editingRuta ? 'Actualizar' : 'Crear')}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Route Map Modal */}
      {showRouteMap && selectedRouteForMap && (
        <div className="form-overlay">
          <div className="route-map-modal">
            <div className="modal-header">
              <h2>Mapa de la Ruta: {selectedRouteForMap.nombre}</h2>
              <button 
                className="close-btn"
                onClick={handleCloseRouteMap}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {(() => {
                const routeClients = selectedRouteForMap.clientes.map(clienteId => {
                  const cliente = clientes.find(c => c.id === clienteId);
                  return cliente;
                }).filter(cliente => cliente && cliente.direccionCoords);
                
                return routeClients.length > 0 ? (
                  <div className="route-map-container">
                    <MapView clientes={routeClients} />
                  </div>
                ) : (
                  <div className="no-coordinates-message">
                    <p>Esta ruta no tiene clientes con coordenadas de ubicación configuradas.</p>
                    <p>Para ver la ubicación en el mapa, asegúrate de que los clientes tengan su dirección configurada correctamente.</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="ruta-content">
        <div className="table-container">
          <table className="rutas-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('nombre')}>
                  Nombre {getSortIndicator('nombre')}
                </th>
                
                <th>Clientes</th>
                <th onClick={() => handleSort('fechaCreacion')}>
                  Fecha Creación {getSortIndicator('fechaCreacion')}
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedRutas.map(ruta => (
                <tr key={ruta.id}>
                                     <td>
                     <div className="ruta-name">
                       <strong>{ruta.nombre}</strong>
                       {ruta.notas && <span className="description">{ruta.notas}</span>}
                     </div>
                   </td>
                                     <td>
                     <div className="clientes-count">
                       {ruta.clientes?.length || 0} clientes
                     </div>
                     {ruta.clientes && ruta.clientes.length > 0 && (
                       <div className="route-preview">
                         {ruta.clientes.slice(0, 3).map((clienteId, index) => (
                           <span key={clienteId} className="route-step">
                             {index + 1}. {getClienteName(clienteId)}
                           </span>
                         ))}
                         {ruta.clientes.length > 3 && (
                           <span className="more-clients">+{ruta.clientes.length - 3} más</span>
                         )}
                       </div>
                     )}
                   </td>
                  <td>{ruta.fechaCreacion}</td>
                                    <td>
                    <div className="actions">
                      <button 
                        className="view-btn"
                        onClick={() => handleViewRouteMap(ruta)}
                      >
                        Ver Mapa
                      </button>
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(ruta)}
                      >
                        Editar
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(ruta.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedRutas.length === 0 && (
          <div className="empty-state">
            <p>No hay rutas creadas. Crea tu primera ruta para comenzar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ruta; 