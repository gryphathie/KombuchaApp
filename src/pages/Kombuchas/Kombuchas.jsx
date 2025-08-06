import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getMexicoDateTime } from '../../utils/dateUtils';
import './Kombuchas.css';

const Kombuchas = () => {
  const [kombuchas, setKombuchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKombucha, setEditingKombucha] = useState(null);
  const [sortField, setSortField] = useState('nombre');
  const [sortDirection, setSortDirection] = useState('asc');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    costoUnitario: '',
  });

  // Fetch kombuchas and calculate sales from Firebase
  const fetchKombuchas = async () => {
    try {
      setLoading(true);
      
      // Fetch kombuchas
      const kombuchasSnapshot = await getDocs(collection(db, 'kombuchas'));
      const kombuchasData = kombuchasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch sales to calculate ventas count
      const ventasSnapshot = await getDocs(collection(db, 'ventas'));
      const ventasData = ventasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate ventas count for each kombucha
      const kombuchasWithVentas = kombuchasData.map(kombucha => {
        let ventasCount = 0;
        
        ventasData.forEach(venta => {
          if (venta.items && Array.isArray(venta.items)) {
            venta.items.forEach(item => {
              if (item.kombuchaId === kombucha.id) {
                ventasCount += parseInt(item.cantidad) || 0;
              }
            });
          } else if (venta.kombucha === kombucha.id) {
            // Fallback for old format
            ventasCount += parseInt(venta.cantidad) || 0;
          }
        });

        return {
          ...kombucha,
          ventas: ventasCount
        };
      });

      setKombuchas(kombuchasWithVentas);
    } catch (error) {
      console.error('Error fetching kombuchas:', error);
      setError('Error al cargar las kombuchas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKombuchas();
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.nombre.trim() || !formData.precio.trim() || !formData.costoUnitario.trim()) {
        setError('Sabor, precio y costo unitario son campos obligatorios');
        return;
      }

      const kombuchaData = {
        nombre: formData.nombre.trim(),
        precio: parseFloat(formData.precio) || 0,
        costoUnitario: parseFloat(formData.costoUnitario) || 0,
        fechaRegistro: editingKombucha ? editingKombucha.fechaRegistro : getMexicoDateTime(),
        fechaActualizacion: getMexicoDateTime()
      };

      if (editingKombucha) {
        await updateDoc(doc(db, 'kombuchas', editingKombucha.id), kombuchaData);
        setKombuchas(prev => prev.map(k => 
          k.id === editingKombucha.id ? { ...k, ...kombuchaData } : k
        ));
        setEditingKombucha(null);
      } else {
        const docRef = await addDoc(collection(db, 'kombuchas'), kombuchaData);
        setKombuchas(prev => [...prev, { id: docRef.id, ...kombuchaData, ventas: 0 }]);
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving kombucha:', error);
      setError('Error al guardar la kombucha');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (kombucha) => {
    setEditingKombucha(kombucha);
    setFormData({
      nombre: kombucha.nombre || '',
      precio: kombucha.precio?.toString() || '',
      costoUnitario: kombucha.costoUnitario?.toString() || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (kombuchaId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta kombucha?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'kombuchas', kombuchaId));
      setKombuchas(prev => prev.filter(kombucha => kombucha.id !== kombuchaId));
    } catch (error) {
      console.error('Error deleting kombucha:', error);
      setError('Error al eliminar la kombucha');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingKombucha(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      precio: '',
      costoUnitario: '',
    });
    setError('');
  };

  const sortedKombuchas = [...kombuchas].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortField === 'precio' || sortField === 'ventas' || sortField === 'costoUnitario') {
      const aNum = parseFloat(aValue) || 0;
      const bNum = parseFloat(bValue) || 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    if (aValue && bValue) {
      return sortDirection === 'asc' 
        ? aValue.toString().localeCompare(bValue.toString()) 
        : bValue.toString().localeCompare(aValue.toString());
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="kombuchas-page">
        <div className="loading">Cargando kombuchas...</div>
      </div>
    );
  }

  return (
    <div className="kombuchas-page">
      <div className="kombuchas-header">
        <h1>Kombuchas</h1>
        <button 
          className="add-kombucha-btn"
          onClick={() => setShowForm(true)}
        >
          + Nueva Kombucha
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ 
          background: '#fed7d7', 
          color: '#c53030', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      <div className="kombuchas-content">
        {kombuchas.length === 0 ? (
          <div className="empty-state">
            <p>No hay kombuchas registradas</p>
            <button 
              className="add-first-kombucha-btn"
              onClick={() => setShowForm(true)}
            >
              Agregar primera kombucha
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="kombuchas-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('nombre')}>
                    Sabor Kombucha {getSortIndicator('nombre')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('precio')}>
                    Precio {getSortIndicator('precio')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('costoUnitario')}>
                    Costo Unitario {getSortIndicator('costoUnitario')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('ventas')}>
                    Ventas {getSortIndicator('ventas')}
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedKombuchas.map((kombucha) => (
                  <tr key={kombucha.id}>
                    <td>{kombucha.nombre}</td>
                    <td className="price-cell">${kombucha.precio?.toFixed(2) || '0.00'}</td>
                    <td className="price-cell">${kombucha.costoUnitario?.toFixed(2) || '0.00'}</td>
                    <td>{kombucha.ventas || 0}</td>
                    <td>
                      <div className="actions">
                        <button className="edit-btn" onClick={() => handleEdit(kombucha)}>
                          Editar
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(kombucha.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Overlay */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h2>{editingKombucha ? 'Editar Kombucha' : 'Nueva Kombucha'}</h2>
            
            {error && (
              <div className="error-message" style={{ 
                background: '#fed7d7', 
                color: '#c53030', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                marginBottom: '1rem' 
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre">Sabor *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  placeholder="Sabor de la kombucha"
                />
              </div>

              <div className="form-group">
                <label htmlFor="precio">Precio *</label>
                <input
                  type="number"
                  id="precio"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="costoUnitario">Costo Unitario *</label>
                <input
                  type="number"
                  id="costoUnitario"
                  name="costoUnitario"
                  value={formData.costoUnitario}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : (editingKombucha ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kombuchas;