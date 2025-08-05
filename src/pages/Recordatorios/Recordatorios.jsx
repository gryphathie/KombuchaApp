import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  generateCustomerNotifications, 
  getNotificationStats, 
  formatNotificationMessage,
  getNotificationPriority 
} from '../../utils/notificationUtils';
import { formatDateForDisplay, getMexicoDate } from '../../utils/dateUtils';
import ReminderCalendar from '../../components/ReminderCalendar';
import './Recordatorios.css';

const Recordatorios = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, overdue, upcoming, contacted, dismissed
  const [stats, setStats] = useState({});
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactNotes, setContactNotes] = useState('');
  const [showCalendar, setShowCalendar] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [remindersForSelectedDate, setRemindersForSelectedDate] = useState([]);
  const [salesForSelectedDate, setSalesForSelectedDate] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  
  // New sale form states
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [kombuchas, setKombuchas] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [saleFormData, setSaleFormData] = useState({
    fecha: getMexicoDate(),
    cliente: '',
    items: [{ kombuchaId: '', cantidad: 1, precio: '' }],
    total: '0.00',
    estado: 'pendiente',
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch sales, customers, and kombuchas data
      const [salesSnapshot, customersSnapshot, kombuchasSnapshot, notificationsSnapshot] = await Promise.all([
        getDocs(collection(db, 'ventas')),
        getDocs(collection(db, 'clientes')),
        getDocs(collection(db, 'kombuchas')),
        getDocs(collection(db, 'notifications'))
      ]);

      const salesData = salesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const customers = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const kombuchasData = kombuchasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get existing notification statuses
      const existingNotifications = {};
      notificationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        existingNotifications[data.notificationId] = data.status;
      });

      // Generate notifications
      const allNotifications = generateCustomerNotifications(salesData, customers);
      
      // Merge with existing statuses
      const mergedNotifications = allNotifications.map(notification => ({
        ...notification,
        status: existingNotifications[notification.notificationId] || 'pending'
      }));

      setNotifications(mergedNotifications);
      setStats(getNotificationStats(mergedNotifications));
      setSales(salesData);
      setCustomers(customers);
      setKombuchas(kombuchasData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle Esc key to close forms
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showContactModal) {
          setShowContactModal(false);
          setSelectedNotification(null);
          setContactNotes('');
        }
        if (showSaleModal) {
          setShowSaleModal(false);
          setSelectedSale(null);
        }
        if (showSaleForm) {
          handleSaleFormCancel();
        }
      }
    };

    // Add event listener when modals are open
    if (showContactModal || showSaleModal || showSaleForm) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showContactModal, showSaleModal, showSaleForm]);

  const saveNotificationStatus = async (notificationId, status, notes = '') => {
    try {
      const notificationData = {
        notificationId,
        status,
        notes,
        updatedAt: new Date().toISOString(),
        updatedBy: 'user' // In a real app, this would be the current user ID
      };

      // Check if notification status already exists
      const existingQuery = await getDocs(collection(db, 'notifications'));
      const existingDoc = existingQuery.docs.find(doc => 
        doc.data().notificationId === notificationId
      );

      if (existingDoc) {
        await updateDoc(doc(db, 'notifications', existingDoc.id), notificationData);
      } else {
        await addDoc(collection(db, 'notifications'), notificationData);
      }

      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.notificationId === notificationId 
          ? { ...notification, status, notes }
          : notification
      ));

      setStats(getNotificationStats(notifications));
    } catch (error) {
      console.error('Error saving notification status:', error);
    }
  };

  const handleContactCustomer = (notification) => {
    setSelectedNotification(notification);
    setContactNotes('');
    setShowContactModal(true);
  };

  const handleContactSubmit = async () => {
    if (selectedNotification) {
      await saveNotificationStatus(selectedNotification.notificationId, 'contacted', contactNotes);
      setShowContactModal(false);
      setSelectedNotification(null);
      setContactNotes('');
    }
  };

  const handleDismiss = async (notificationId) => {
    await saveNotificationStatus(notificationId, 'dismissed');
  };

  const handleReset = async (notificationId) => {
    await saveNotificationStatus(notificationId, 'pending');
  };

  const handleDateClick = (date, remindersForDate) => {
    // Removed filtering logic - just store the date for reference
    setSelectedDate(date);
    setRemindersForSelectedDate(remindersForDate);
  };

  const handleReminderClick = (reminder) => {
    setSelectedNotification(reminder);
    setContactNotes('');
    setShowContactModal(true);
  };

  const handleSaleClick = (sale) => {
    setSelectedSale(sale);
    setShowSaleModal(true);
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.nombre : 'Cliente no encontrado';
  };

  // Sale form handling functions
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
      
      // Refresh data
      await fetchNotifications();
    } catch (error) {
      console.error('Error creating sale:', error);
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
  };

  const handleDateClickForSale = (date) => {
    setSelectedDate(date);
    const dateKey = date.toISOString().split('T')[0];
    const remindersForDate = notifications.filter(n => 
      n.status === 'pending' && n.reminderDate === dateKey
    );
    setRemindersForSelectedDate(remindersForDate);
    
    // Set the selected date in the sale form
    setSaleFormData(prev => ({
      ...prev,
      fecha: dateKey
    }));
    setShowSaleForm(true);
  };

  const getFilteredNotifications = () => {
    // Apply status filter only - removed date filtering
    switch (filter) {
      case 'pending':
        return notifications.filter(n => n.status === 'pending');
      case 'overdue':
        return notifications.filter(n => n.status === 'pending' && n.isDue);
      case 'upcoming':
        return notifications.filter(n => n.status === 'pending' && !n.isDue);
      case 'contacted':
        return notifications.filter(n => n.status === 'contacted');
      case 'dismissed':
        return notifications.filter(n => n.status === 'dismissed');
      default:
        return notifications;
    }
  };

  const getPriorityClass = (notification) => {
    const priority = getNotificationPriority(notification);
    return `priority-${priority}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'contacted':
        return '✅';
      case 'dismissed':
        return '❌';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="recordatorios-page">
        <div className="loading">Cargando recordatorios...</div>
      </div>
    );
  }

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="recordatorios-page">
      <div className="recordatorios-header">
        <h1>Recordatorios de Clientes</h1>
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-item overdue">
            <span className="stat-number">{stats.overdue}</span>
            <span className="stat-label">Vencidos</span>
          </div>
          <div className="stat-item upcoming">
            <span className="stat-number">{stats.upcoming}</span>
            <span className="stat-label">Próximos</span>
          </div>
        </div>
      </div>

      <div className="view-controls">
        <div className="view-toggle">
          <button 
            className={`view-btn ${showCalendar ? 'active' : ''}`}
            onClick={() => setShowCalendar(true)}
          >
            📅 Vista Calendario
          </button>
          <button 
            className={`view-btn ${!showCalendar ? 'active' : ''}`}
            onClick={() => setShowCalendar(false)}
          >
            📋 Lista recordatorios
          </button>
        </div>
        
        {selectedDate && (
          <div className="selected-date-info">
            <span>
              {formatDateForDisplay(selectedDate.toISOString().split('T')[0])} - 
              Fecha seleccionada
            </span>
            <button 
              className="clear-date-btn"
              onClick={() => {
                setSelectedDate(null);
                setRemindersForSelectedDate([]);
              }}
            >
              ✕ Limpiar
            </button>
          </div>
        )}
      </div>

      {showCalendar && (
        <ReminderCalendar 
          notifications={notifications}
          sales={sales}
          onDateClick={handleDateClick}
          onReminderClick={handleReminderClick}
          onSaleClick={handleSaleClick}
          onDateClickForSale={handleDateClickForSale}
        />
      )}

      <div className="filter-controls">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({stats.total})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pendientes ({stats.pending})
        </button>
        <button 
          className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
          onClick={() => setFilter('overdue')}
        >
          Vencidos ({stats.overdue})
        </button>
        <button 
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Próximos ({stats.upcoming})
        </button>
        <button 
          className={`filter-btn ${filter === 'contacted' ? 'active' : ''}`}
          onClick={() => setFilter('contacted')}
        >
          Contactados ({stats.contacted})
        </button>
        <button 
          className={`filter-btn ${filter === 'dismissed' ? 'active' : ''}`}
          onClick={() => setFilter('dismissed')}
        >
          Descartados ({stats.dismissed})
        </button>
      </div>

      <div className="notifications-content">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <p>No hay recordatorios para mostrar</p>
          </div>
        ) : (
          <div className="notifications-grid">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.notificationId}
                className={`notification-card ${getPriorityClass(notification)} ${notification.status}`}
              >
                <div className="notification-header">
                  <div className="customer-info">
                    <h3>{notification.customerName}</h3>
                    <div className="status-badge">
                      {getStatusIcon(notification.status)}
                      {notification.status === 'pending' && notification.isDue ? 'Vencido' : 
                       notification.status === 'pending' ? 'Pendiente' :
                       notification.status === 'contacted' ? 'Contactado' : 'Descartado'}
                    </div>
                  </div>
                  <div className="priority-indicator">
                    {getNotificationPriority(notification) === 'high' ? '🔴' :
                     getNotificationPriority(notification) === 'medium' ? '🟡' : '🟢'}
                  </div>
                </div>

                <div className="notification-details">
                  <div className="detail-row">
                    <span className="label">Última compra:</span>
                    <span className="value">{formatDateForDisplay(notification.lastSaleDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Kombuchas:</span>
                    <span className="value text-center">{notification.totalKombuchas}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Recordatorio:</span>
                    <span className="value">{formatDateForDisplay(notification.reminderDate)}</span>
                  </div>
                  {notification.isDue && (
                    <div className="detail-row overdue">
                      <span className="label">Días de retraso:</span>
                      <span className="value">{notification.daysOverdue}</span>
                    </div>
                  )}
                  {!notification.isDue && (
                    <div className="detail-row upcoming">
                      <span className="label">Días restantes:</span>
                      <span className="value">{notification.daysUntilDue}</span>
                    </div>
                  )}
                </div>

                <div className="notification-message">
                  {formatNotificationMessage(notification)}
                </div>

                {notification.notes && (
                  <div className="notification-notes">
                    <strong>Notas:</strong> {notification.notes}
                  </div>
                )}

                <div className="notification-actions">
                  {notification.status === 'pending' && (
                    <>
                      <button 
                        className="action-btn contact-btn"
                        onClick={() => handleContactCustomer(notification)}
                      >
                        📞 Contactar
                      </button>
                      <button 
                        className="action-btn dismiss-btn"
                        onClick={() => handleDismiss(notification.notificationId)}
                      >
                        ❌ Descartar
                      </button>
                    </>
                  )}
                  {notification.status === 'contacted' && (
                    <button 
                      className="action-btn reset-btn"
                      onClick={() => handleReset(notification.notificationId)}
                    >
                      🔄 Reactivar
                    </button>
                  )}
                  {notification.status === 'dismissed' && (
                    <button 
                      className="action-btn reset-btn"
                      onClick={() => handleReset(notification.notificationId)}
                    >
                      🔄 Reactivar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {showContactModal && selectedNotification && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Contactar Cliente</h2>
            <div className="customer-summary">
              <p><strong>Cliente:</strong> {selectedNotification.customerName}</p>
              <p><strong>Teléfono:</strong> {selectedNotification.customerPhone || 'No disponible'}</p>
              <p><strong>Última compra:</strong> {formatDateForDisplay(selectedNotification.lastSaleDate)}</p>
              <p><strong>Kombuchas compradas:</strong> {selectedNotification.totalKombuchas}</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="contactNotes">Notas del contacto:</label>
              <textarea
                id="contactNotes"
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                placeholder="Describe el resultado del contacto..."
                rows="4"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowContactModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="submit-btn"
                onClick={handleContactSubmit}
              >
                Marcar como Contactado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {showSaleModal && selectedSale && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Detalles de Venta</h2>
            <div className="sale-summary">
              <p><strong>ID de Venta:</strong> {selectedSale.id}</p>
              <p><strong>Fecha:</strong> {formatDateForDisplay(selectedSale.fecha)}</p>
              <p><strong>Total:</strong> ${parseFloat(selectedSale.total || 0).toFixed(2)}</p>
              <p><strong>Estado:</strong> {selectedSale.estado || 'Pendiente'}</p>
              {selectedSale.cliente && (
                <p><strong>Cliente:</strong> {getCustomerName(selectedSale.cliente)}</p>
              )}
            </div>
            
            {selectedSale.items && selectedSale.items.length > 0 && (
              <div className="sale-items">
                <h3>Productos Vendidos</h3>
                <div className="items-list">
                  {selectedSale.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <span className="item-name">Producto {index + 1}</span>
                      <span className="item-quantity">Cantidad: {item.cantidad}</span>
                      <span className="item-price">Precio: ${parseFloat(item.precio || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowSaleModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Sale Form Modal */}
      {showSaleForm && (
        <div className="modal-overlay">
          <div className="modal-content sale-form-modal">
            <h2>Nueva Venta - {formatDateForDisplay(saleFormData.fecha)}</h2>
            
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
                  {customers.map(cliente => (
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
              
              <div className="modal-actions">
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
};

export default Recordatorios; 