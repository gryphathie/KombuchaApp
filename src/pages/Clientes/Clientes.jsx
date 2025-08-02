import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './Clientes.css';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',    
    fechaRegistro: '',
  });

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
    
    try {
      const clienteData = {
        ...formData,
        fechaRegistro: formData.fechaRegistro || new Date().toISOString().split('T')[0]
      };

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
                <textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  rows="3"
                />
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
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Fecha de Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
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
    </div>
  );
}

export default Clientes;
