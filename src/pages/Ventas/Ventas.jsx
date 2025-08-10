import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { getMexicoDate, getMexicoMonth, getMexicoDateTime, formatDateForDisplay, formatMonthYear } from '../../utils/dateUtils';
import './Ventas.css';

const Ventas = () => {
  const location = useLocation();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVenta, setEditingVenta] = useState(null);
  const [sortField, setSortField] = useState('fecha');
  const [sortDirection, setSortDirection] = useState('asc');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [kombuchas, setKombuchas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [monthFilter, setMonthFilter] = useState(getMexicoMonth()); // Current month YYYY-MM
  const [viewMode, setViewMode] = useState('sales'); // 'sales' or 'clientSummary'
  const [formData, setFormData] = useState({
    fecha: getMexicoDate(), // Today's date in YYYY-MM-DD format
    cliente: '',
    items: [{ kombuchaId: '', cantidad: 1, precio: '' }],
    total: '0.00',
    estado: 'pendiente',
  });

  // Fetch sales from Firebase
  const fetchVentas = async () => {
    try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'ventas'));
        const ventasData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setVentas(ventasData);
    } catch (error) {
        console.error('Error fetching sales:', error);
        setError('Error al cargar las ventas');
    } finally {
        setLoading(false);
    }
  };

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
    }
  };

  // Fetch Clientes from Firebase
  const fetchClientes = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'clientes'));
        const clientesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setClientes(clientesData);
    } catch (error) {
        console.error('Error fetching clientes:', error);
    }
  };

  useEffect(() => {
    fetchVentas();
    fetchKombuchas();
    fetchClientes();
  }, []);

  // Handle navigation state from Clientes page
  useEffect(() => {
    if (location.state?.selectedCliente && location.state?.showForm) {
      setFormData(prev => ({
        ...prev,
        cliente: location.state.selectedCliente.id
      }));
      setShowForm(true);
    }
  }, [location.state]);

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

  // Handle item changes (kombucha, cantidad, precio)
  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      // Auto-suggest price when kombucha is selected (only if price is empty)
      if (field === 'kombuchaId' && value) {
        const selectedKombucha = kombuchas.find(k => k.id === value);
        if (selectedKombucha && selectedKombucha.precio && !updatedItems[index].precio) {
          updatedItems[index].precio = selectedKombucha.precio;
        }
      }
      
      // Auto-calculate total
      const total = updatedItems.reduce((sum, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      return {
        ...prev,
        items: updatedItems,
        total: total.toFixed(2)
      };
    });
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { kombuchaId: '', cantidad: 1, precio: '' }]
    }));
  };

  // Remove item
  const removeItem = (index) => {
    setFormData(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      if (updatedItems.length === 0) {
        updatedItems.push({ kombuchaId: '', cantidad: 1, precio: '' });
      }
      
      // Recalculate total
      const total = updatedItems.reduce((sum, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      return {
        ...prev,
        items: updatedItems,
        total: total.toFixed(2)
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
        // Validate required fields
        if (!formData.fecha.trim() || !formData.cliente.trim()) {
            setError('Fecha y cliente son campos obligatorios');
            return;
        }

        // Validate items
        const validItems = formData.items.filter(item => item.kombuchaId && item.cantidad > 0);
        if (validItems.length === 0) {
            setError('Debe agregar al menos un item con kombucha y cantidad');
            return;
        }

        const ventaData = {
            fecha: formData.fecha.trim(),
            cliente: formData.cliente.trim(),
            items: validItems,
            total: parseFloat(formData.total),
            estado: formData.estado,
            fechaRegistro: editingVenta && editingVenta.fechaRegistro ? editingVenta.fechaRegistro : getMexicoDateTime(),
            fechaActualizacion: getMexicoDateTime()
        };

        if (editingVenta) {
            await updateDoc(doc(db, 'ventas', editingVenta.id), ventaData);
            setVentas(prev => prev.map(v => v.id === editingVenta.id ? { ...v, ...ventaData } : v));
            setEditingVenta(null);
        } else {
            const docRef = await addDoc(collection(db, 'ventas'), ventaData);
            setVentas(prev => [...prev, { id: docRef.id, ...ventaData }]);
        }

        setShowForm(false);
        resetForm();
    } catch (error) {
        console.error('Error saving sale:', error);
        setError('Error al guardar la venta');
    } finally {
        setSubmitting(false);
    }
  };

  const handleEdit = (venta) => {
    setEditingVenta(venta);
    
    // Convert old format to new format if needed
    let items = [];
    if (venta.items && Array.isArray(venta.items)) {
      items = venta.items;
    } else if (venta.kombucha) {
      // Convert old single item format to new format
      items = [{
        kombuchaId: venta.kombucha,
        cantidad: parseFloat(venta.cantidad) || 1,
        precio: parseFloat(venta.precio) || 0
      }];
    }
    
    if (items.length === 0) {
      items = [{ kombuchaId: '', cantidad: 1, precio: 0 }];
    }
    
    const total = items.reduce((sum, item) => {
      const cantidad = parseFloat(item.cantidad) || 0;
      const precio = parseFloat(item.precio) || 0;
      return sum + (cantidad * precio);
    }, 0);
    
    setFormData({
        fecha: venta.fecha || '',
        cliente: venta.cliente || '',
        items: items,
        total: total.toFixed(2),
        estado: venta.estado || 'pendiente',
    });
    setShowForm(true);
  };

  const handleDelete = async (ventaId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      return;
    }

    try {
        await deleteDoc(doc(db, 'ventas', ventaId));
        setVentas(prev => prev.filter(v => v.id !== ventaId));
    } catch (error) {
        console.error('Error deleting sale:', error);
        setError('Error al eliminar la venta');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVenta(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
        fecha: getMexicoDate(), // Today's date
        cliente: '',
        items: [{ kombuchaId: '', cantidad: 1, precio: '' }],
        total: '0.00',
        estado: 'pendiente',
    });
  };

  // Helper function to get kombucha name by ID
  const getKombuchaName = (kombuchaId) => {
    const kombucha = kombuchas.find(k => k.id === kombuchaId);
    return kombucha ? kombucha.nombre : 'Kombucha no encontrada';
  };

  // Helper function to get cliente name by ID
  const getClienteName = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  // Get original product price
  const getOriginalPrice = (kombuchaId) => {
    const kombucha = kombuchas.find(k => k.id === kombuchaId);
    return kombucha ? kombucha.precio : null;
  };

  // Check if price has been modified
  const isPriceModified = (item) => {
    if (!item.kombuchaId || !item.precio) return false;
    const originalPrice = getOriginalPrice(item.kombuchaId);
    return originalPrice && parseFloat(item.precio) !== parseFloat(originalPrice);
  };

  // Filter sales by month
  const filteredVentas = ventas.filter(venta => {
    if (!monthFilter) return true;
    const ventaMonth = venta.fecha ? venta.fecha.slice(0, 7) : '';
    return ventaMonth === monthFilter;
  });

  // Calculate monthly statistics
  const getMonthlyStats = () => {
    const monthlyVentas = filteredVentas;
    const totalSales = monthlyVentas.length;
    const totalRevenue = monthlyVentas
      .filter(venta => venta.estado !== 'cancelada')
      .reduce((sum, venta) => sum + (parseFloat(venta.total) || 0), 0);
    const completedSales = monthlyVentas.filter(venta => venta.estado === 'completada').length;
    const pendingSales = monthlyVentas.filter(venta => venta.estado === 'pendiente').length;
    const canceledSales = monthlyVentas.filter(venta => venta.estado === 'cancelada').length;
    const paymentPendingSales = monthlyVentas.filter(venta => venta.estado === 'pagoPendiente').length;

    return {
      totalSales,
      totalRevenue,
      completedSales,
      pendingSales,
      canceledSales,
      paymentPendingSales
    };
  };

  // Calculate client summary for the month
  const getClientSummary = () => {
    const monthlyVentas = filteredVentas;
    const clientSummary = {};

    monthlyVentas.forEach(venta => {
      const clienteId = venta.cliente;
      const clienteName = getClienteName(clienteId);
      
      if (!clientSummary[clienteId]) {
        clientSummary[clienteId] = {
          clienteId,
          clienteName,
          totalPurchases: 0,
          totalAmount: 0,
          kombuchaCounts: {},
          lastPurchase: null
        };
      }

      // Only count non-canceled sales
      if (venta.estado !== 'cancelada') {
        // Count kombuchas from items
        if (venta.items && Array.isArray(venta.items)) {
          venta.items.forEach(item => {
            const kombuchaName = getKombuchaName(item.kombuchaId);
            const cantidad = parseFloat(item.cantidad) || 0;
            
            if (!clientSummary[clienteId].kombuchaCounts[kombuchaName]) {
              clientSummary[clienteId].kombuchaCounts[kombuchaName] = 0;
            }
            clientSummary[clienteId].kombuchaCounts[kombuchaName] += cantidad;
            clientSummary[clienteId].totalPurchases += cantidad;
          });
        } else if (venta.kombucha) {
          // Fallback for old format
          const kombuchaName = getKombuchaName(venta.kombucha);
          const cantidad = parseFloat(venta.cantidad) || 0;
          
          if (!clientSummary[clienteId].kombuchaCounts[kombuchaName]) {
            clientSummary[clienteId].kombuchaCounts[kombuchaName] = 0;
          }
          clientSummary[clienteId].kombuchaCounts[kombuchaName] += cantidad;
          clientSummary[clienteId].totalPurchases += cantidad;
        }

        clientSummary[clienteId].totalAmount += parseFloat(venta.total) || 0;
      }
      
      // Track last purchase date
      if (!clientSummary[clienteId].lastPurchase || venta.fecha > clientSummary[clienteId].lastPurchase) {
        clientSummary[clienteId].lastPurchase = venta.fecha;
      }
    });

    return Object.values(clientSummary).sort((a, b) => b.totalPurchases - a.totalPurchases);
  };

  const monthlyStats = getMonthlyStats();
  const clientSummary = getClientSummary();

  const sortedVentas = [...filteredVentas].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortField === 'precio' || sortField === 'total') {
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
        <div className="ventas-page">
            <div className="loading">Cargando ventas...</div>
        </div>
    );
  }

  return (
    <div className="ventas-page">
        <div className="ventas-header">
            <h1>Ventas</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ color: '#2d3748', fontWeight: '600', fontSize: '0.9rem' }}>
                        Filtrar por mes:
                    </label>
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            backgroundColor: 'white'
                        }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        className={`view-toggle-btn ${viewMode === 'sales' ? 'active' : ''}`}
                        onClick={() => setViewMode('sales')}
                    >
                        Ventas
                    </button>
                    <button 
                        className={`view-toggle-btn ${viewMode === 'clientSummary' ? 'active' : ''}`}
                        onClick={() => setViewMode('clientSummary')}
                    >
                        Resumen Clientes
                    </button>
                </div>
                
                <button className="add-venta-btn" onClick={() => setShowForm(true)}>+ Nueva Venta</button>
            </div>
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

        <div className="ventas-content">
            {/* Monthly Statistics */}
            <div style={{ 
                padding: '1.5rem', 
                backgroundColor: '#f7fafc', 
                borderBottom: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
            }}>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Total Ventas</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#2d3748' }}>
                        {monthlyStats.totalSales}
                    </p>
                </div>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Ingresos Totales</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#38a169' }}>
                        ${monthlyStats.totalRevenue.toFixed(2)}
                    </p>
                </div>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Completadas</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#38a169' }}>
                        {monthlyStats.completedSales}
                    </p>
                </div>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Pendientes</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#d69e2e' }}>
                        {monthlyStats.pendingSales}
                    </p>
                </div>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Canceladas</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#c53030' }}>
                        {monthlyStats.canceledSales}
                    </p>
                </div>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>Pago Pendiente</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#d69e2e' }}>
                        {monthlyStats.paymentPendingSales}
                    </p>
                </div>
            </div>

            {/* Client Summary View */}
            {viewMode === 'clientSummary' && (
                <div style={{ padding: '1.5rem' }}>
                    <h2 style={{ 
                        margin: '0 0 1.5rem 0', 
                        color: '#2d3748', 
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        textAlign: 'center'
                    }}>
                        Resumen de Compras por Cliente - {formatMonthYear(monthFilter)}
                    </h2>
                    
                    {clientSummary.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '3rem', 
                            color: '#718096',
                            fontSize: '1.1rem'
                        }}>
                            No hay compras registradas para {formatMonthYear(monthFilter)}
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {clientSummary.map((client, index) => (
                                <div key={client.clienteId} className="client-summary-card" style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid #e2e8f0',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '1rem',
                                        paddingBottom: '1rem',
                                        borderBottom: '2px solid #f7fafc'
                                    }}>
                                        <div>
                                            <h3 style={{
                                                margin: '0 0 0.5rem 0',
                                                color: '#2d3748',
                                                fontSize: '1.2rem',
                                                fontWeight: '700'
                                            }}>
                                                {client.clienteName}
                                            </h3>
                                            <p style={{
                                                margin: 0,
                                                color: '#718096',
                                                fontSize: '0.9rem'
                                            }}>
                                                Última compra: {client.lastPurchase || 'N/A'}
                                            </p>
                                        </div>
                                        <div style={{
                                            textAlign: 'right'
                                        }}>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 'bold',
                                                color: '#38a169',
                                                marginBottom: '0.25rem'
                                            }}>
                                                {client.totalPurchases}
                                            </div>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: '#718096',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                Kombuchas
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{
                                            fontSize: '1.1rem',
                                            fontWeight: '600',
                                            color: '#2d3748',
                                            marginBottom: '0.75rem'
                                        }}>
                                            Total Gastado: ${client.totalAmount.toFixed(2)}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 style={{
                                            margin: '0 0 0.75rem 0',
                                            color: '#4a5568',
                                            fontSize: '0.95rem',
                                            fontWeight: '600'
                                        }}>
                                            Detalle por Tipo:
                                        </h4>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem'
                                        }}>
                                            {Object.entries(client.kombuchaCounts).map(([kombuchaName, count]) => (
                                                <div key={kombuchaName} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem',
                                                    backgroundColor: '#f7fafc',
                                                    borderRadius: '6px',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    <span style={{
                                                        color: '#2d3748',
                                                        fontWeight: '500'
                                                    }}>
                                                        {kombuchaName}
                                                    </span>
                                                    <span style={{
                                                        color: '#38a169',
                                                        fontWeight: '600',
                                                        fontSize: '1rem'
                                                    }}>
                                                        {count}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Sales Table View */}
            {viewMode === 'sales' && (
                <>
                    {sortedVentas.length === 0 ? (
                        <div className="empty-state">
                            <p>No hay ventas registradas para {formatMonthYear(monthFilter)}</p>
                            <button className="add-venta-btn" onClick={() => setShowForm(true)}>+ Nueva Venta</button>
                        </div>
                    ) : (
                        <div className="ventas-table-container">
                            <table className="ventas-table">
                                <thead>
                                    <tr>
                                        <th className="sortable" onClick={() => handleSort('fecha')}>
                                            Fecha {getSortIndicator('fecha')}
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('cliente')}>
                                            Cliente {getSortIndicator('cliente')}
                                        </th>
                                        <th>Items</th>
                                        <th className="sortable" onClick={() => handleSort('total')}>
                                            Total {getSortIndicator('total')}
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('estado')}>
                                            Estado {getSortIndicator('estado')}
                                        </th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedVentas.map(venta => (
                                        <tr key={venta.id}>
                                            <td>{venta.fecha}</td>
                                            <td>{getClienteName(venta.cliente)}</td>
                                            <td>
                                                {venta.items && Array.isArray(venta.items) ? (
                                                    <div style={{ maxWidth: '300px' }}>
                                                        {venta.items.map((item, index) => (
                                                            <div key={index} style={{ 
                                                                marginBottom: '0.5rem',
                                                                padding: '0.5rem',
                                                                backgroundColor: '#f7fafc',
                                                                borderRadius: '4px',
                                                                fontSize: '0.85rem'
                                                            }}>
                                                                <strong>{getKombuchaName(item.kombuchaId)}</strong>
                                                                <br />
                                                                Cantidad: {item.cantidad} × ${(parseFloat(item.precio) || 0).toFixed(2)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    // Fallback for old format
                                                    <div>
                                                        {venta.kombucha && (
                                                            <div style={{ 
                                                                padding: '0.5rem',
                                                                backgroundColor: '#f7fafc',
                                                                borderRadius: '4px',
                                                                fontSize: '0.85rem'
                                                            }}>
                                                                <strong>{getKombuchaName(venta.kombucha)}</strong>
                                                                <br />
                                                                Cantidad: {venta.cantidad} × ${(parseFloat(venta.precio) || 0).toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="total-cell">${(parseFloat(venta.total) || 0).toFixed(2)}</td>
                                            <td>
                                                <span className={`status-badge status-${venta.estado}`}>
                                                    {venta.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions">
                                                    <button className="edit-btn" onClick={() => handleEdit(venta)}>Editar</button>
                                                    <button className="delete-btn" onClick={() => handleDelete(venta.id)}>Eliminar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Form Overlay */}
        {showForm && (
            <div className="form-overlay">
                <div className="form-container">
                    <h2>{editingVenta ? 'Editar Venta' : 'Nueva Venta'}</h2>

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
                            <label htmlFor="fecha">Fecha *</label>
                            <input
                                type="date"
                                id="fecha"
                                name="fecha"
                                value={formData.fecha}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cliente">Cliente *</label>
                            <select
                                id="cliente"
                                name="cliente"
                                value={formData.cliente}
                                onChange={handleInputChange}
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
                                    onClick={addItem}
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
                            
                            {formData.items.map((item, index) => (
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
                                        {formData.items.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeItem(index)}
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
                                                onChange={(e) => handleItemChange(index, 'kombuchaId', e.target.value)}
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
                                                onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
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
                                                onChange={(e) => handleItemChange(index, 'precio', e.target.value)}
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
                                                                    onClick={() => handleItemChange(index, 'precio', getOriginalPrice(item.kombuchaId))}
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
                                value={formData.total}
                                readOnly
                                style={{ 
                                    backgroundColor: '#f7fafc', 
                                    color: '#4a5568',
                                    cursor: 'not-allowed',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                }}
                            />
                            <small style={{ color: 'white', fontSize: '0.8rem' }}>
                                Calculado automáticamente (suma de todos los productos)
                            </small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="estado">Estado *</label>
                            <select
                                id="estado"
                                name="estado"
                                value={formData.estado}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="pendiente">Pendiente</option>
                                <option value="cancelada">Cancelada</option>
                                <option value="pagoPendiente">Pago Pendiente</option>
                                <option value="completada">Completada</option>
                            </select>
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
                                {submitting ? 'Guardando...' : (editingVenta ? 'Actualizar' : 'Guardar')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Ventas;