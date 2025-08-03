import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  generateCustomerNotifications, 
  getNotificationStats, 
  formatNotificationMessage,
  getNotificationPriority 
} from '../../utils/notificationUtils';
import { formatDateForDisplay } from '../../utils/dateUtils';
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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch sales and customers data
      const [salesSnapshot, customersSnapshot, notificationsSnapshot] = await Promise.all([
        getDocs(collection(db, 'ventas')),
        getDocs(collection(db, 'clientes')),
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
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
    setSelectedDate(date);
    setRemindersForSelectedDate(remindersForDate);
    setFilter('all'); // Reset filter when selecting a date
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

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    // If a date is selected, filter by that date
    if (selectedDate) {
      const dateKey = selectedDate.toISOString().split('T')[0];
      filtered = remindersForSelectedDate;
    }
    
    // Apply status filter
    switch (filter) {
      case 'pending':
        return filtered.filter(n => n.status === 'pending');
      case 'overdue':
        return filtered.filter(n => n.status === 'pending' && n.isDue);
      case 'upcoming':
        return filtered.filter(n => n.status === 'pending' && !n.isDue);
      case 'contacted':
        return filtered.filter(n => n.status === 'contacted');
      case 'dismissed':
        return filtered.filter(n => n.status === 'dismissed');
      default:
        return filtered;
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
            📋 Vista Lista
          </button>
        </div>
        
        {selectedDate && (
          <div className="selected-date-info">
            <span>
              {formatDateForDisplay(selectedDate.toISOString().split('T')[0])} - 
              {remindersForSelectedDate.length} recordatorios
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
                    <span className="label">Días de espera:</span>
                    <span className="value">{notification.daysToWait}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Fecha recordatorio:</span>
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
                  {notification.customerPhone && (
                    <div className="detail-row">
                      <span className="label">Teléfono:</span>
                      <span className="value">{notification.customerPhone}</span>
                    </div>
                  )}
                  {notification.customerAddress && (
                    <div className="detail-row">
                      <span className="label">Dirección:</span>
                      <span className="value">{notification.customerAddress}</span>
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
    </div>
  );
};

export default Recordatorios; 