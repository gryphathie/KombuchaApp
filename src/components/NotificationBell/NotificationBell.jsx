import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { generateCustomerNotifications, getNotificationStats } from '../../utils/notificationUtils';
import './NotificationBell.css';

const NotificationBell = ({ onNotificationClick }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch sales and customers data
      const [salesSnapshot, customersSnapshot] = await Promise.all([
        getDocs(collection(db, 'ventas')),
        getDocs(collection(db, 'clientes'))
      ]);

      const sales = salesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const customers = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Generate notifications
      const allNotifications = generateCustomerNotifications(sales, customers);
      const stats = getNotificationStats(allNotifications);
      
      // Get recent pending notifications (max 5)
      const pendingNotifications = allNotifications
        .filter(n => n.status === 'pending')
        .slice(0, 5);

      setNotificationCount(stats.pending);
      setRecentNotifications(pendingNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = (notification) => {
    setShowDropdown(false);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getPriorityIcon = (notification) => {
    if (notification.isDue && notification.daysOverdue >= 7) {
      return '🔴'; // High priority
    } else if (notification.isDue) {
      return '🟡'; // Medium priority
    } else {
      return '🟢'; // Low priority
    }
  };

  if (loading) {
    return (
      <div className="notification-bell">
        <div className="bell-icon">🔔</div>
      </div>
    );
  }

  return (
    <div className="notification-bell-container">
      <div 
        className={`notification-bell ${notificationCount > 0 ? 'has-notifications' : ''}`}
        onClick={handleBellClick}
      >
        <div className="bell-icon">🔔</div>
        {notificationCount > 0 && (
          <div className="notification-badge">
            {notificationCount > 99 ? '99+' : notificationCount}
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Recordatorios de Clientes</h3>
            <span className="notification-count">{notificationCount} pendientes</span>
          </div>
          
          {recentNotifications.length === 0 ? (
            <div className="no-notifications">
              <p>No hay recordatorios pendientes</p>
            </div>
          ) : (
            <div className="notification-list">
              {recentNotifications.map((notification) => (
                <div 
                  key={notification.notificationId}
                  className={`notification-item ${notification.isDue ? 'overdue' : 'upcoming'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-priority">
                    {getPriorityIcon(notification)}
                  </div>
                  <div className="notification-content">
                    <div className="customer-name">{notification.customerName}</div>
                    <div className="notification-message">
                      {notification.isDue 
                        ? `¡${notification.daysOverdue} días de retraso!`
                        : `En ${notification.daysUntilDue} días`
                      }
                    </div>
                    <div className="kombucha-info">
                      Compró {notification.totalKombuchas} kombuchas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="dropdown-footer">
            <button 
              className="view-all-btn"
              onClick={() => {
                setShowDropdown(false);
                if (onNotificationClick) {
                  onNotificationClick({ type: 'view-all' });
                }
              }}
            >
              Ver todos los recordatorios
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 