import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { getMexicoDate, formatDateForDisplay } from '../../utils/dateUtils';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import LocationRestrictions from '../../components/LocationRestrictions';
import AddressPreviewMap from '../../components/AddressPreviewMap';
import { getRestrictedCities, getRestrictedStates } from '../../config/locationConfig';
import './Clientes.css';

function Clientes() {
  const navigate = useNavigate();
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
  
  // Sales form states
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [kombuchas, setKombuchas] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClienteForSale, setSelectedClienteForSale] = useState(null);
  const [saleFormData, setSaleFormData] = useState({
    fecha: getMexicoDate(),
    cliente: '',
    items: [{ kombuchaId: '', cantidad: 1, precio: '' }],
    total: '0.00',
    estado: 'pendiente',
  });

  // Fetch clients from Firebase
  const fetchClientes = async () => {
    try {
      console.log('Fetching clients from Firebase...');
      const [clientesSnapshot, kombuchasSnapshot] = await Promise.all([
        getDocs(collection(db, 'clientes')),
        getDocs(collection(db, 'kombuchas'))
      ]);
      
      const clientesData = clientesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const kombuchasData = kombuchasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Processed clients data:', clientesData);
      console.log('Processed kombuchas data:', kombuchasData);
      
      setClientes(clientesData);
      setKombuchas(kombuchasData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Handle Esc key to close forms
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showForm) {
          handleCancel();
        }
        if (showSaleForm) {
          handleSaleFormCancel();
        }
      }
    };

    // Add event listener when forms are open
    if (showForm || showSaleForm) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showForm, showSaleForm]);

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

  // Sales form handling functions
  const handleSaleFormInputChange = (e) => {
    const { name, value } = e.target;
    setSaleFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaleItemChange = (index, field, value) => {
    setSaleFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };

      // Auto-populate price when kombucha is selected
      if (field === 'kombuchaId' && value) {
        const selectedKombucha = kombuchas.find(k => k.id === value);
        if (selectedKombucha && selectedKombucha.precio) {
          newItems[index].precio = selectedKombucha.precio.toString();
        }
      }

      // Auto-calculate total
      const total = newItems.reduce((sum, item) => {
        const itemTotal = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0);
        return sum + itemTotal;
      }, 0);

      return {
        ...prev,
        items: newItems,
        total: total.toFixed(2)
      };
    });
  };

  const addSaleItem = () => {
    setSaleFormData(prev => ({
      ...prev,
      items: [...prev.items, { kombuchaId: '', cantidad: 1, precio: '' }]
    }));
  };

  const removeSaleItem = (index) => {
    setSaleFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getKombuchaName = (kombuchaId) => {
    const kombucha = kombuchas.find(k => k.id === kombuchaId);
    return kombucha ? kombucha.nombre : 'Kombucha no encontrada';
  };

  const getOriginalPrice = (kombuchaId) => {
    const kombucha = kombuchas.find(k => k.id === kombuchaId);
    return kombucha ? kombucha.precio : null;
  };

  const isPriceModified = (item) => {
    if (!item.kombuchaId) return false;
    const originalPrice = getOriginalPrice(item.kombuchaId);
    return originalPrice && parseFloat(item.precio) !== parseFloat(originalPrice);
  };

  const handleSaleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const saleData = {
        ...saleFormData,
        fecha: saleFormData.fecha,
        total: parseFloat(saleFormData.total),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'ventas'), saleData);
      
      // Reset form and close modal
      setSaleFormData({
        fecha: getMexicoDate(),
        cliente: '',
        items: [{ kombuchaId: '', cantidad: 1, precio: '' }],
        total: '0.00',
        estado: 'pendiente',
      });
      setShowSaleForm(false);
      setSelectedClienteForSale(null);
      
      // Show success message or refresh data
      alert('Venta registrada exitosamente');
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error al registrar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaleFormCancel = () => {
    setSaleFormData({
      fecha: getMexicoDate(),
      cliente: '',
      items: [{ kombuchaId: '', cantidad: 1, precio: '' }],
      total: '0.00',
      estado: 'pendiente',
    });
    setShowSaleForm(false);
    setSelectedClienteForSale(null);
  };

  // Handle navigation to add new sale for specific client
  const handleAddSale = (cliente) => {
    setSelectedClienteForSale(cliente);
    setSaleFormData(prev => ({
      ...prev,
      cliente: cliente.id,
      fecha: getMexicoDate()
    }));
    setShowSaleForm(true);
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
                      <button 
                        className="add-sale-btn"
                        onClick={() => handleAddSale(cliente)}
                      >
                        + Venta
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

      {/* New Sale Form Modal */}
      {showSaleForm && (
        <div className="form-overlay">
          <div className="form-container sale-form-modal">
            <h2>Nueva Venta - {selectedClienteForSale?.nombre} - {formatDateForDisplay(saleFormData.fecha)}</h2>
            
            <form onSubmit={handleSaleFormSubmit}>
              <div className="form-group">
                <label htmlFor="fecha">Fecha *</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={saleFormData.fecha}
                  onChange={handleSaleFormInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cliente">Cliente *</label>
                <select
                  id="cliente"
                  name="cliente"
                  value={saleFormData.cliente}
                  onChange={handleSaleFormInputChange}
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Productos de la Venta *</label>
                <div style={{ marginBottom: '1rem' }}>
                  <button 
                    type="button" 
                    onClick={addSaleItem}
                    style={{
                      background: '#4299e1',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    + Agregar Producto
                  </button>
                </div>
                
                {saleFormData.items.map((item, index) => (
                  <div key={index} style={{ 
                    border: '1px solid #667eea', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    marginBottom: '1rem',
                    backgroundColor: 'rgb(102, 126, 234)',
                    color: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ color: 'white', margin: 0 }}>Producto {index + 1}</h4>
                      {saleFormData.items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeSaleItem(index)}
                          style={{
                            background: '#f56565',
                            color: 'white',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                          Kombucha *
                        </label>
                        <select
                          value={item.kombuchaId}
                          onChange={(e) => handleSaleItemChange(index, 'kombuchaId', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '2px solid #667eea',
                            borderRadius: '5px',
                            backgroundColor: 'white',
                            color: '#2d3748'
                          }}
                          required
                        >
                          <option value="">Selecciona una kombucha</option>
                          {kombuchas.map(kombucha => (
                            <option key={kombucha.id} value={kombucha.id}>
                              {kombucha.nombre} - ${kombucha.precio?.toFixed(2) || '0.00'}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleSaleItemChange(index, 'cantidad', e.target.value)}
                          min="1"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '2px solid #667eea',
                            borderRadius: '5px',
                            backgroundColor: 'white',
                            color: '#2d3748'
                          }}
                          required
                        />
                      </div>
                      
                      <div>
                        <label style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                          Precio *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precio}
                          onChange={(e) => handleSaleItemChange(index, 'precio', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: isPriceModified(item) ? '2px solid #f56565' : '2px solid #667eea',
                            borderRadius: '5px',
                            backgroundColor: 'white',
                            color: '#4a5568'
                          }}
                          placeholder="0.00"
                        />
                        <small style={{ color: 'white', fontSize: '0.7rem' }}>
                          {item.kombuchaId && getOriginalPrice(item.kombuchaId) ? (
                            <>
                              Precio original: ${getOriginalPrice(item.kombuchaId).toFixed(2)}
                              {isPriceModified(item) && (
                                <>
                                  <span style={{ color: '#f56565', fontWeight: 'bold' }}>
                                    {' '}• Modificado
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleSaleItemChange(index, 'precio', getOriginalPrice(item.kombuchaId))}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#4299e1',
                                      textDecoration: 'underline',
                                      cursor: 'pointer',
                                      fontSize: '0.7rem',
                                      marginLeft: '0.5rem'
                                    }}
                                  >
                                    Restaurar
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            'Precio sugerido del producto (puede ser modificado)'
                          )}
                        </small>
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '5px',
                      textAlign: 'center'
                    }}>
                      <strong style={{ color: 'white' }}>
                        Subtotal: ${((parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0)).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="form-group">
                <label htmlFor="total">Total *</label>
                <input
                  type="number"
                  id="total"
                  name="total"
                  value={saleFormData.total}
                  readOnly
                  style={{ 
                    backgroundColor: '#f7fafc', 
                    color: '#4a5568',
                    cursor: 'not-allowed',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}
                />
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  Calculado automáticamente (suma de todos los productos)
                </small>
              </div>
              
              <div className="form-group">
                <label htmlFor="estado">Estado *</label>
                <select
                  id="estado"
                  name="estado"
                  value={saleFormData.estado}
                  onChange={handleSaleFormInputChange}
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleSaleFormCancel}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Guardar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
