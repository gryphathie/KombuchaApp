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
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    foto: '',
  });

  // Fetch kombuchas from Firebase
  const fetchKombuchas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'kombuchas'));
      const kombuchasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setKombuchas(kombuchasData);
    } catch (error) {
      console.error('Error fetching kombuchas:', error);
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const kombuchaData = {
        ...formData,
        fechaRegistro: new Date().toISOString()
      };

      if (editingKombucha) {
        await updateDoc(doc(db, 'kombuchas', editingKombucha.id), kombuchaData);
        setEditingKombucha(null);
      } else {
        await addDoc(collection(db, 'kombuchas'), kombuchaData);
      }

      setShowForm(false);
      setFormData({
        nombre: '',
        precio: '',
        foto: '',
      });

      setEditingKombucha(null);
    } catch (error) {
      console.error('Error saving kombucha:', error);
    }
  };

  const handleEdit = (kombucha) => {
    setEditingKombucha(kombucha);
    setFormData({
      nombre: kombucha.nombre,
      precio: kombucha.precio,
      foto: kombucha.foto,    
    });
  };

  const handleDelete = async (kombuchaId) => {
    try {
      await deleteDoc(doc(db, 'kombuchas', kombuchaId));
      setKombuchas(kombuchas.filter(kombucha => kombucha.id !== kombuchaId));
    } catch (error) {
      console.error('Error deleting kombucha:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingKombucha(null);
  };

  const sortedKombuchas = [...kombuchas].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (aValue && bValue) {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return 0;
  });

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
      <div className="kombuchas-content">
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
                <th className="sortable" onClick={() => handleSort('foto')}>
                  Foto {getSortIndicator('foto')}
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedKombuchas.map((kombucha) => (
                <tr key={kombucha.id}>
                  <td>{kombucha.nombre}</td>
                  <td>{kombucha.precio}</td>
                  <td>{kombucha.foto}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(kombucha)}>
                      Editar
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(kombucha.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Kombuchas;