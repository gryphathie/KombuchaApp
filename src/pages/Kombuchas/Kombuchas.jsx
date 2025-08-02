import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
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
    foto: '',
    descripcion: '',
    stock: '',
  });

  // Fetch kombuchas from Firebase
  const fetchKombuchas = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'kombuchas'));
      const kombuchasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setKombuchas(kombuchasData);
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
      if (!formData.nombre.trim() || !formData.precio.trim()) {
        setError('Nombre y precio son campos obligatorios');
        return;
      }

      const kombuchaData = {
        ...formData,
        nombre: formData.nombre.trim(),
        precio: parseFloat(formData.precio) || 0,
        stock: parseInt(formData.stock) || 0,
        fechaRegistro: editingKombucha ? editingKombucha.fechaRegistro : new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      };

      if (editingKombucha) {
        await updateDoc(doc(db, 'kombuchas', editingKombucha.id), kombuchaData);
        setKombuchas(prev => prev.map(k => 
          k.id === editingKombucha.id ? { ...k, ...kombuchaData } : k
        ));
        setEditingKombucha(null);
      } else {
        const docRef = await addDoc(collection(db, 'kombuchas'), kombuchaData);
        setKombuchas(prev => [...prev, { id: docRef.id, ...kombuchaData }]);
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
      foto: kombucha.foto || '',
      descripcion: kombucha.descripcion || '',
      stock: kombucha.stock?.toString() || '',
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
      foto: '',
      descripcion: '',
      stock: '',
    });
    setError('');
  };

  const sortedKombuchas = [...kombuchas].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortField === 'precio' || sortField === 'stock') {
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
                    Nombre {getSortIndicator('nombre')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('precio')}>
                    Precio {getSortIndicator('precio')}
                  </th>
                  <th>Foto</th>
                  <th>Descripción</th>
                  <th className="sortable" onClick={() => handleSort('stock')}>
                    Stock {getSortIndicator('stock')}
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedKombuchas.map((kombucha) => (
                  <tr key={kombucha.id}>
                    <td>{kombucha.nombre}</td>
                    <td className="price-cell">${kombucha.precio?.toFixed(2) || '0.00'}</td>
                    <td>
                      {kombucha.foto ? (
                        <img 
                          src={kombucha.foto} 
                          alt={kombucha.nombre}
                          className="kombucha-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="kombucha-image-placeholder">
                          Sin foto
                        </div>
                      )}
                    </td>
                    <td>{kombucha.descripcion || '-'}</td>
                    <td>{kombucha.stock || 0}</td>
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
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre de la kombucha"
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
                <label htmlFor="foto">URL de la Foto</label>
                <input
                  type="url"
                  id="foto"
                  name="foto"
                  value={formData.foto}
                  onChange={handleInputChange}
                  placeholder="https://ejemplo.com/foto.jpg"
                />
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Descripción de la kombucha"
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
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